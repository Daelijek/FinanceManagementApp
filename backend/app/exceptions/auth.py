# app/exceptions/auth.py
from fastapi import HTTPException, status


class AuthException(HTTPException):
    """Базовое исключение для авторизации"""
    pass


class InvalidCredentialsException(AuthException):
    """Неверные учетные данные"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


class UserNotActiveException(AuthException):
    """Пользователь не активен"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )


class UserNotVerifiedException(AuthException):
    """Пользователь не верифицирован"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User email is not verified"
        )


class TokenExpiredException(AuthException):
    """Токен истек"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


class InvalidTokenException(AuthException):
    """Недействительный токен"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )