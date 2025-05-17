# 💰 FinTrack API

A modern FastAPI backend for personal finance management.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.95.1-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13.0+-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### User Management
- 🔐 Secure authentication with JWT tokens
- 🔑 OAuth integration (Google, Apple)
- 📧 Email verification system
- 🔄 Password reset functionality
- 🛡️ Password strength validation

### Financial Tools
- 📊 Financial dashboard with savings and credit score
- 🏦 Bank account management
- 💹 Budget category tracking (income/expenses)
- 🌍 Personalization (language, currency, notifications)

## 🛠️ Tech Stack

- **FastAPI**: High-performance web framework
- **SQLAlchemy**: ORM for database interactions
- **PostgreSQL**: Relational database
- **Alembic**: Database migration tool
- **Pydantic**: Data validation and settings management
- **JWT**: Token-based authentication
- **bcrypt**: Secure password hashing

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fintrack-api
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # or
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Start the development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Access API documentation**
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 📝 API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Create a new user account |
| `/api/v1/auth/login` | POST | Authenticate user |
| `/api/v1/auth/refresh` | POST | Refresh JWT token |
| `/api/v1/auth/logout` | POST | Invalidate tokens |
| `/api/v1/auth/oauth/login` | POST | Login via OAuth provider |
| `/api/v1/auth/password-reset/request` | POST | Request password reset |
| `/api/v1/auth/password-reset/confirm` | POST | Confirm password reset |

### User Profile

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/me` | GET | Retrieve current user |
| `/api/v1/users/me` | PUT | Update user information |
| `/api/v1/users/me` | DELETE | Delete user account |
| `/api/v1/users/verify-email` | POST | Verify email address |
| `/api/v1/users/change-password` | POST | Change password |

### Financial Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/profile/` | GET | Retrieve user profile |
| `/api/v1/profile/` | PUT | Update user profile |
| `/api/v1/profile/financial` | GET | Get financial summary |
| `/api/v1/profile/accounts` | GET | List bank accounts |
| `/api/v1/profile/accounts` | POST | Add bank account |
| `/api/v1/profile/full` | GET | Get complete profile with financial data |

### Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/settings/currency` | GET | List available currencies |
| `/api/v1/settings/currency/{code}` | PUT | Change default currency |
| `/api/v1/settings/language` | GET | List available languages |
| `/api/v1/settings/language/{code}` | PUT | Change language preference |
| `/api/v1/settings/notifications` | PUT | Update notification preferences |

### Budget Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/categories/` | GET | List all categories |
| `/api/v1/categories/` | POST | Create new category |
| `/api/v1/categories/system` | GET | List system categories |
| `/api/v1/categories/{id}` | PUT | Update category |
| `/api/v1/categories/{id}` | DELETE | Delete category |

## 🏗️ Project Structure

```
fintrack-api/
├── app/
│   ├── main.py                # Entry point
│   ├── config.py              # Application configuration
│   ├── database.py            # Database connection
│   ├── api/                   # Route definitions
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   ├── utils/                 # Helper utilities
│   └── exceptions/            # Custom exceptions
├── alembic/                   # Database migrations
├── tests/                     # Test suite
├── requirements.txt           # Dependencies
├── .env                       # Environment variables
└── README.md                  # Documentation
```

## 🔒 Security

- Password hashing using bcrypt
- JWT token authentication with refresh mechanism
- Password strength requirements
- SQL injection protection via SQLAlchemy
- CORS configuration for frontend integration

## 🧪 Development

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you have any questions or need assistance:
- Open an issue on GitHub
- Contact the development team at [example@email.com](mailto:example@email.com)