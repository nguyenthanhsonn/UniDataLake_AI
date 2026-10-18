"""Kiểm tra giới hạn quyền và chuẩn bị credentials, không thay IAM thật."""

from __future__ import annotations

import json
import stat
from pathlib import Path
from unittest.mock import Mock

import pytest
from dotenv import dotenv_values

from app.infra.minio.service_accounts import (
    ACCOUNTS,
    policy_for,
    prepare,
    provision,
    update_reader_policy,
    update_writer_policy,
)


@pytest.mark.parametrize("role", ACCOUNTS)
def test_policy_has_only_bronze_permissions(role: str) -> None:
    policy = policy_for(role, "bronze")
    actions = {
        a
        for statement in policy["Statement"]
        if statement["Effect"] == "Allow"
        for a in statement["Action"]
    }
    resources = {r for statement in policy["Statement"] for r in statement["Resource"]}
    assert resources == {"arn:aws:s3:::bronze", "arn:aws:s3:::bronze/*"}
    assert not any("Delete" in a or "admin" in a or "*" in a for a in actions)
    assert ("s3:PutObject" in actions) == (role == "writer")
    assert ("s3:GetObjectVersion" in actions) == (role != "writer")
    assert ("s3:ListBucket" in actions) == (role == "reader")
    if role == "writer":
        denied = {a for s in policy["Statement"] if s["Effect"] == "Deny" for a in s["Action"]}
        assert denied == {
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:DeleteObject",
            "s3:DeleteObjectVersion",
        }
    if role == "reader":
        denied = {a for s in policy["Statement"] if s["Effect"] == "Deny" for a in s["Action"]}
        assert denied == {"s3:PutObject*", "s3:DeleteObject*", "s3:AbortMultipartUpload"}


def test_attach_reader_policy_preserves_secret_and_other_accounts() -> None:
    admin = Mock()
    admin.get_service_account.return_value = json.dumps({"policy": policy_for("reader", "bronze")})
    update_reader_policy(admin, "bronze-reader", "bronze")
    admin.update_service_account.assert_called_once_with(
        access_key="bronze-reader", policy=policy_for("reader", "bronze")
    )
    admin.add_service_account.assert_not_called()


def test_update_existing_writer_does_not_rotate_credentials() -> None:
    admin = Mock()
    actual = policy_for("writer", "bronze")
    for statement in actual["Statement"]:
        statement["Action"].reverse()
    admin.get_service_account.return_value = json.dumps({"policy": json.dumps(actual)})
    update_writer_policy(admin, "bronze-writer", "bronze")
    admin.update_service_account.assert_called_once_with(
        access_key="bronze-writer", policy=policy_for("writer", "bronze")
    )
    admin.add_service_account.assert_not_called()


def test_update_detects_incorrect_server_policy() -> None:
    admin = Mock()
    admin.get_service_account.return_value = json.dumps({"policy": policy_for("reader", "bronze")})
    with pytest.raises(RuntimeError, match="BRONZE_WRITER_POLICY_VERIFICATION_FAILED"):
        update_writer_policy(admin, "bronze-writer", "bronze")


def test_prepare_and_provision(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    path = tmp_path / ".env.accounts.local"
    prepare(path)
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    credentials = dict(dotenv_values(path))
    admin = Mock()
    # Admin trả secret trong response: provision tuyệt đối không được in response này.
    admin.add_service_account.return_value = "sensitive-admin-response"
    provision(admin, credentials, "bronze")
    assert admin.add_service_account.call_count == 3
    for call, role in zip(admin.add_service_account.call_args_list, ACCOUNTS, strict=True):
        assert call.kwargs["policy"] == policy_for(role, "bronze")
        assert call.kwargs["access_key"] == f"bronze-{role}"
    output = capsys.readouterr().out
    assert "sensitive-admin-response" not in output
    for key, value in credentials.items():
        if "SECRET" in key:
            assert value is not None
            assert value not in output
    with pytest.raises(FileExistsError):
        prepare(path)


def test_missing_credentials_creates_nothing() -> None:
    admin = Mock()
    with pytest.raises(ValueError, match="BRONZE_ACCOUNT_CREDENTIALS_REQUIRED"):
        provision(admin, {}, "bronze")
    admin.add_service_account.assert_not_called()
