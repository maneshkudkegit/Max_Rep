from app.models.notification import Notification


def create_alert(db, tenant_id: int, user_id: int, kind: str, title: str, message: str, channel: str = 'in_app') -> None:
    db.add(
        Notification(
            tenant_id=tenant_id,
            user_id=user_id,
            kind=kind,
            title=title,
            message=message,
            channel=channel,
            status='unread',
        )
    )
