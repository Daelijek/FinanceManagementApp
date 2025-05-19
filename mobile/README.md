Нужно убедиться что LOCAL_IP указан правильный IP адреес. Ее можно проверить через CMD команда ipconfig. И нужно чтобы девайс и локалка находились в одной сети

1. Установите и запустите ngrok

    Если у вас ещё нет ngrok, установите его командой (нужен рабочий npm):

npm install -g ngrok

В корне вашего бэкенд-проекта (где запущен Uvicorn) выполните:

ngrok http 8000

ngrok выдаст вам две строки — публичный HTTP и HTTPS адреса, например:

    Forwarding                    https://abcd1234.ngrok.io -> http://localhost:8000

    Скопируйте именно HTTPS-URL (https://abcd1234.ngrok.io).

2. Обновите API_URL в вашем React Native коде

В Registration.js (и во всех местах, где вы делаете fetch) замените локальный адрес на ngrok-URL:

// Registration.js

// Вместо локального IP:
const API_URL = "https://abcd1234.ngrok.io";

// … ваш код, где:
await fetch(`${API_URL}/api/v1/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(registrationData),
});

Сохраните файл.
3. Перезапустите Expo

В директории mobile снова запустите Metro в режиме LAN (или просто без флага, если вы уже сканировали QR):

npx expo start --lan

Снова отсканируйте QR-код в Expo Go на iPhone.

Установка зависимости для отправки email

pip install fastapi-mail

Для запуска бэкенда.
python -m venv venv
.\venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd C:\Users\Public\Programming\projects\Diploma\FinanceManagementApplication\DaniyarBranch\FinanceManagementApp