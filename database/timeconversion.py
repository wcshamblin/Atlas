from datetime import datetime


def from_str_to_datetime(date: str) -> datetime:
    return datetime.strptime(date, "%Y-%m-%dT%H:%M:%S:%fZ")


def from_datetime_to_str(date: datetime) -> str:
    return datetime.strftime(date, "%Y-%m-%dT%H:%M:%S:%fZ")
