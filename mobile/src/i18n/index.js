// src/i18n/index.js - Полная конфигурация со всеми переводами
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            common: {
                save: "Save",
                cancel: "Cancel",
                delete: "Delete",
                edit: "Edit",
                add: "Add",
                back: "Back",
                next: "Next",
                confirm: "Confirm",
                loading: "Loading...",
                error: "Error",
                success: "Success",
                today: "Today",
                yesterday: "Yesterday",
                search: "Search",
                select: "Select",
                done: "Done"
            },
            navigation: {
                home: "Home",
                transactions: "Transactions",
                budget: "Budget",
                reports: "Reports",
                profile: "Profile"
            },
            auth: {
                welcome_back: "Welcome back",
                manage_finances: "Manage your finances with confidence",
                start_journey: "Start Your Financial Journey",
                join_millions: "Join millions managing their money smarter",
                email: "Email Address",
                password: "Password",
                confirm_password: "Confirm Password",
                full_name: "Full Name",
                enter_email: "Enter your email",
                enter_password: "Enter your password",
                create_password: "Create password",
                confirm_password_text: "Confirm password",
                forgot_password: "Forgot password?",
                sign_in: "Sign in",
                sign_up: "Sign up",
                create_account: "Create Account",
                have_account: "Already have an account?",
                no_account: "Don't have an account?",
                continue_with: "or continue with",
                secure_data: "Your data is secure with 256-bit encryption",
                agree_terms: "By signing up, you agree to our Terms of Service and",
                privacy_policy: "Privacy Policy",
                google: "Google",
                apple: "Apple"
            },
            home: {
                welcome_back: "Welcome back",
                total_balance: "Total Balance",
                vs_last_month: "vs last month",
                recent_transactions: "Recent Transactions",
                see_all: "See all",
                budget_overview: "Budget Overview",
                monthly_expenses: "Monthly Expenses",
                no_data: "No data available",
                no_comparison: "No data available for comparison",
                actions: {
                    add: "Add",
                    transfer: "Transfer",
                    budget: "Budget",
                    reports: "Reports"
                }
            },
            transactions: {
                title: "Transactions",
                all: "All",
                income: "Income",
                expenses: "Expenses",
                week: "Week",
                month: "Month",
                year: "Year",
                search_placeholder: "Search by description",
                no_transactions: "No transactions found",
                no_transactions_period: "No transactions found for this period",
                spending_by_category: "Spending by Category",
                add_transaction: "Add Transaction",
                edit_transaction: "Edit Transaction",
                expense: "Expense",
                category: "Category",
                date: "Date",
                note: "Note",
                add_note: "Add note",
                payment_method: "Payment Method",
                select_method: "Select...",
                cash: "Cash",
                card: "Card",
                recurring_transaction: "Recurring Transaction",
                add_receipt: "Add Receipt Photo",
                save_transaction: "Save Transaction",
                delete_transaction: "Delete Transaction",
                confirm_delete: "Are you sure you want to delete this transaction?",
                description_required: "Description cannot be empty",
                amount_required: "Enter a valid amount",
                category_required: "Select a category",
                method_required: "Select a payment method",
                transaction_saved: "Transaction saved successfully",
                transaction_deleted: "Transaction deleted successfully"
            },
            profile: {
                title: "Profile",
                premium_member: "Premium Member",
                balance: "Balance",
                savings: "Savings",
                credit_score: "Credit Score",
                account_settings: "Account Settings",
                personal_information: "Personal Information",
                security_privacy: "Security & Privacy",
                notifications: "Notifications",
                connected_accounts: "Connected Accounts",
                preferences: "Preferences",
                currency: "Currency",
                language: "Language",
                app_settings: "App Settings",
                budget_categories: "Budget Categories",
                support_help: "Support & Help",
                help_center: "Help Center",
                about_app: "About App",
                version: "Version 2.4.1"
            },
            settings: {
                display_appearance: "Display & Appearance",
                theme_mode: "Theme Mode",
                light: "Light",
                dark: "Dark"
            },
            categories: {
                income: "Income",
                expense: "Expense",
                add_category: "Add Category",
                edit_category: "Edit a category",
                add_new_category: "Add a new category",
                title: "Title",
                description: "Description",
                select_icon: "Select icon",
                select_color: "Select color",
                category_exists: "A category with this name already exists",
                category_saved: "Category saved successfully",
                category_deleted: "Category deleted successfully"
            },
            personal_info: {
                full_name: "Full Name",
                email_address: "Email Address",
                phone_number: "Phone Number",
                date_of_birth: "Date of Birth",
                address: "Address",
                tax_residence: "Tax Residence",
                select_country: "Select Country",
                change_photo: "Change Photo",
                save_changes: "Save Changes",
                data_saved: "Data saved successfully",
                photo_updated: "Photo updated successfully",
                gallery_permission: "Gallery access permission required"
            },
            notifications: {
                title: "Notifications",
                all: "All",
                transactions: "Transactions",
                bills: "Bills",
                security: "Security",
                today: "Today",
                yesterday: "Yesterday",
                earlier_week: "Earlier This Week",
                large_transaction: "Large Transaction Detected",
                upcoming_bill: "Upcoming Bill Payment",
                new_device: "New Device Login",
                budget_goal: "Budget Goal Achieved",
                weekly_summary: "Weekly Spending Summary"
            },
            privacy_policy: {
                title: "Privacy Policy",
                last_updated: "Last Updated: May 16, 2025",
                intro: "We at FinanceApp are committed to protecting your privacy.",
                info_collect: "Information We Collect",
                how_use: "How We Use Your Information",
                data_security: "Data Security",
                your_rights: "Your Rights",
                contact_us: "Contact Us"
            },
            forgot_password: {
                title: "Password Recovery",
                subtitle: "Enter your email to receive a link or a reset code.",
                send_code: "Send code",
                back_to_login: "← Back to Login",
                new_password: "New password",
                enter_code: "Enter the code and a new password for",
                code_from_email: "The code from the email",
                new_password_field: "New password",
                password_repeat: "Password Repeat",
                confirm: "Confirm",
                back_to_recovery: "← Back to Password Recovery"
            },
            language_screen: {
                search_placeholder: "Search languages",
                current_language: "Current Language",
                all_languages: "All Languages",
                change_immediately: "App language will change immediately after selection"
            },
            budget: {
                title: "Budget",
                welcome: "Welcome to the Budget Screen"
            },
            reports: {
                title: "Reports",
                welcome: "Welcome to the Reports Screen"
            },
            transfer: {
                title: "Transfer",
                welcome: "Welcome to the Transfers Screen"
            }
        }
    },
    ru: {
        translation: {
            common: {
                save: "Сохранить",
                cancel: "Отмена",
                delete: "Удалить",
                edit: "Редактировать",
                add: "Добавить",
                back: "Назад",
                next: "Далее",
                confirm: "Подтвердить",
                loading: "Загрузка...",
                error: "Ошибка",
                success: "Успешно",
                today: "Сегодня",
                yesterday: "Вчера",
                search: "Поиск",
                select: "Выбрать",
                done: "Готово"
            },
            navigation: {
                home: "Главная",
                transactions: "Транзакции",
                budget: "Бюджет",
                reports: "Отчеты",
                profile: "Профиль"
            },
            auth: {
                welcome_back: "Добро пожаловать",
                manage_finances: "Управляйте своими финансами с уверенностью",
                start_journey: "Начните свой финансовый путь",
                join_millions: "Присоединяйтесь к миллионам людей, которые управляют деньгами умнее",
                email: "Email адрес",
                password: "Пароль",
                confirm_password: "Подтвердите пароль",
                full_name: "Полное имя",
                enter_email: "Введите ваш email",
                enter_password: "Введите ваш пароль",
                create_password: "Создайте пароль",
                confirm_password_text: "Подтвердите пароль",
                forgot_password: "Забыли пароль?",
                sign_in: "Войти",
                sign_up: "Регистрация",
                create_account: "Создать аккаунт",
                have_account: "Уже есть аккаунт?",
                no_account: "Нет аккаунта?",
                continue_with: "или продолжить с",
                secure_data: "Ваши данные защищены 256-битным шифрованием",
                agree_terms: "Регистрируясь, вы соглашаетесь с нашими Условиями использования и",
                privacy_policy: "Политикой конфиденциальности",
                google: "Google",
                apple: "Apple"
            },
            home: {
                welcome_back: "С возвращением",
                total_balance: "Общий баланс",
                vs_last_month: "по сравнению с прошлым месяцем",
                recent_transactions: "Последние транзакции",
                see_all: "Показать все",
                budget_overview: "Обзор бюджета",
                monthly_expenses: "Месячные расходы",
                no_data: "Нет данных",
                no_comparison: "Нет данных для сравнения",
                actions: {
                    add: "Добавить",
                    transfer: "Перевод",
                    budget: "Бюджет",
                    reports: "Отчеты"
                }
            },
            transactions: {
                title: "Транзакции",
                all: "Все",
                income: "Доходы",
                expenses: "Расходы",
                week: "Неделя",
                month: "Месяц",
                year: "Год",
                search_placeholder: "Поиск по описанию",
                no_transactions: "Транзакции не найдены",
                no_transactions_period: "Транзакции за этот период не найдены",
                spending_by_category: "Расходы по категориям",
                add_transaction: "Добавить транзакцию",
                edit_transaction: "Редактировать транзакцию",
                expense: "Расход",
                category: "Категория",
                date: "Дата",
                note: "Заметка",
                add_note: "Добавить заметку",
                payment_method: "Способ оплаты",
                select_method: "Выберите...",
                cash: "Наличные",
                card: "Карта",
                recurring_transaction: "Повторяющаяся транзакция",
                add_receipt: "Добавить фото чека",
                save_transaction: "Сохранить транзакцию",
                delete_transaction: "Удалить транзакцию",
                confirm_delete: "Вы уверены, что хотите удалить эту транзакцию?",
                description_required: "Описание не может быть пустым",
                amount_required: "Введите корректную сумму",
                category_required: "Выберите категорию",
                method_required: "Выберите способ оплаты",
                transaction_saved: "Транзакция успешно сохранена",
                transaction_deleted: "Транзакция успешно удалена"
            },
            profile: {
                title: "Профиль",
                premium_member: "Премиум участник",
                balance: "Баланс",
                savings: "Сбережения",
                credit_score: "Кредитный рейтинг",
                account_settings: "Настройки аккаунта",
                personal_information: "Личная информация",
                security_privacy: "Безопасность и конфиденциальность",
                notifications: "Уведомления",
                connected_accounts: "Подключенные аккаунты",
                preferences: "Предпочтения",
                currency: "Валюта",
                language: "Язык",
                app_settings: "Настройки приложения",
                budget_categories: "Категории бюджета",
                support_help: "Поддержка и помощь",
                help_center: "Центр помощи",
                about_app: "О приложении",
                version: "Версия 2.4.1"
            },
            settings: {
                display_appearance: "Отображение и внешний вид",
                theme_mode: "Режим темы",
                light: "Светлая",
                dark: "Темная"
            },
            categories: {
                income: "Доход",
                expense: "Расход",
                add_category: "Добавить категорию",
                edit_category: "Редактировать категорию",
                add_new_category: "Добавить новую категорию",
                title: "Название",
                description: "Описание",
                select_icon: "Выберите иконку",
                select_color: "Выберите цвет",
                category_exists: "Категория с таким названием уже существует",
                category_saved: "Категория успешно сохранена",
                category_deleted: "Категория успешно удалена"
            },
            personal_info: {
                full_name: "Полное имя",
                email_address: "Email адрес",
                phone_number: "Номер телефона",
                date_of_birth: "Дата рождения",
                address: "Адрес",
                tax_residence: "Налоговое резидентство",
                select_country: "Выберите страну",
                change_photo: "Изменить фото",
                save_changes: "Сохранить изменения",
                data_saved: "Данные успешно сохранены",
                photo_updated: "Фото успешно обновлено",
                gallery_permission: "Необходимо разрешение на доступ к галерее"
            },
            notifications: {
                title: "Уведомления",
                all: "Все",
                transactions: "Транзакции",
                bills: "Счета",
                security: "Безопасность",
                today: "Сегодня",
                yesterday: "Вчера",
                earlier_week: "Ранее на этой неделе",
                large_transaction: "Обнаружена крупная транзакция",
                upcoming_bill: "Предстоящий платеж по счету",
                new_device: "Вход с нового устройства",
                budget_goal: "Цель бюджета достигнута",
                weekly_summary: "Недельная сводка расходов"
            },
            privacy_policy: {
                title: "Политика конфиденциальности",
                last_updated: "Последнее обновление: 16 мая 2025 г.",
                intro: "Мы в FinanceApp привержены защите вашей конфиденциальности.",
                info_collect: "Информация, которую мы собираем",
                how_use: "Как мы используем вашу информацию",
                data_security: "Безопасность данных",
                your_rights: "Ваши права",
                contact_us: "Свяжитесь с нами"
            },
            forgot_password: {
                title: "Восстановление пароля",
                subtitle: "Введите ваш email для получения ссылки или кода сброса.",
                send_code: "Отправить код",
                back_to_login: "← Назад к входу",
                new_password: "Новый пароль",
                enter_code: "Введите код и новый пароль для",
                code_from_email: "Код из email",
                new_password_field: "Новый пароль",
                password_repeat: "Повторите пароль",
                confirm: "Подтвердить",
                back_to_recovery: "← Назад к восстановлению пароля"
            },
            language_screen: {
                search_placeholder: "Поиск языков",
                current_language: "Текущий язык",
                all_languages: "Все языки",
                change_immediately: "Язык приложения изменится сразу после выбора"
            },
            budget: {
                title: "Бюджет",
                welcome: "Добро пожаловать на экран бюджета"
            },
            reports: {
                title: "Отчеты",
                welcome: "Добро пожаловать на экран отчетов"
            },
            transfer: {
                title: "Переводы",
                welcome: "Добро пожаловать на экран переводов"
            }
        }
    },
    kz: {
        translation: {
            common: {
                save: "Сақтау",
                cancel: "Болдырмау",
                delete: "Жою",
                edit: "Өңдеу",
                add: "Қосу",
                back: "Артқа",
                next: "Алдыға",
                confirm: "Растау",
                loading: "Жүктелуде...",
                error: "Қате",
                success: "Сәтті",
                today: "Бүгін",
                yesterday: "Кеше",
                search: "Іздеу",
                select: "Таңдау",
                done: "Дайын"
            },
            navigation: {
                home: "Басты бет",
                transactions: "Транзакциялар",
                budget: "Бюджет",
                reports: "Есептер",
                profile: "Профиль"
            },
            auth: {
                welcome_back: "Қайта келуіңізбен",
                manage_finances: "Қаржыңызды сенімділікпен басқарыңыз",
                start_journey: "Қаржылық сапарыңызды бастаңыз",
                join_millions: "Ақшасын ақылды басқаратын миллиондаған адамдарға қосылыңыз",
                email: "Email мекенжайы",
                password: "Құпия сөз",
                confirm_password: "Құпия сөзді растаңыз",
                full_name: "Толық аты-жөні",
                enter_email: "Email мекенжайыңызды енгізіңіз",
                enter_password: "Құпия сөзіңізді енгізіңіз",
                create_password: "Құпия сөз жасаңыз",
                confirm_password_text: "Құпия сөзді растаңыз",
                forgot_password: "Құпия сөзді ұмыттыңыз ба?",
                sign_in: "Кіру",
                sign_up: "Тіркелу",
                create_account: "Аккаунт жасау",
                have_account: "Аккаунтыңыз бар ма?",
                no_account: "Аккаунтыңыз жоқ па?",
                continue_with: "немесе мынамен жалғастыру",
                secure_data: "Деректеріңіз 256-битті шифрлаумен қорғалған",
                agree_terms: "Тіркелу арқылы біздің Қызмет шарттары мен келісесіз",
                privacy_policy: "Құпиялылық саясаты",
                google: "Google",
                apple: "Apple"
            },
            home: {
                welcome_back: "Қайта келуіңізбен",
                total_balance: "Жалпы баланс",
                vs_last_month: "өткен айға қарағанда",
                recent_transactions: "Соңғы транзакциялар",
                see_all: "Барлығын көру",
                budget_overview: "Бюджет шолуы",
                monthly_expenses: "Ай сайынғы шығыстар",
                no_data: "Деректер жоқ",
                no_comparison: "Салыстыру үшін деректер жоқ",
                actions: {
                    add: "Қосу",
                    transfer: "Аудару",
                    budget: "Бюджет",
                    reports: "Есептер"
                }
            },
            transactions: {
                title: "Транзакциялар",
                all: "Барлығы",
                income: "Кірістер",
                expenses: "Шығыстар",
                week: "Апта",
                month: "Ай",
                year: "Жыл",
                search_placeholder: "Сипаттама бойынша іздеу",
                no_transactions: "Транзакциялар табылмады",
                no_transactions_period: "Бұл кезең үшін транзакциялар табылмады",
                spending_by_category: "Санат бойынша шығыстар",
                add_transaction: "Транзакция қосу",
                edit_transaction: "Транзакцияны өңдеу",
                expense: "Шығыс",
                category: "Санат",
                date: "Күні",
                note: "Ескерту",
                add_note: "Ескерту қосу",
                payment_method: "Төлем әдісі",
                select_method: "Таңдаңыз...",
                cash: "Нақты ақша",
                card: "Карта",
                recurring_transaction: "Қайталанатын транзакция",
                add_receipt: "Чек фотосын қосу",
                save_transaction: "Транзакцияны сақтау",
                delete_transaction: "Транзакцияны жою",
                confirm_delete: "Бұл транзакцияны жойғыңыз келетініне сенімдісіз бе?",
                description_required: "Сипаттама бос болмауы керек",
                amount_required: "Дұрыс сомасын енгізіңіз",
                category_required: "Санатты таңдаңыз",
                method_required: "Төлем әдісін таңдаңыз",
                transaction_saved: "Транзакция сәтті сақталды",
                transaction_deleted: "Транзакция сәтті жойылды"
            },
            profile: {
                title: "Профиль",
                premium_member: "Премиум мүше",
                balance: "Баланс",
                savings: "Жинақтар",
                credit_score: "Кредиттік рейтинг",
                account_settings: "Аккаунт параметрлері",
                personal_information: "Жеке ақпарат",
                security_privacy: "Қауіпсіздік пен құпиялылық",
                notifications: "Хабарландырулар",
                connected_accounts: "Қосылған аккаунттар",
                preferences: "Артықшылықтар",
                currency: "Валюта",
                language: "Тіл",
                app_settings: "Қолданба параметрлері",
                budget_categories: "Бюджет санаттары",
                support_help: "Қолдау және көмек",
                help_center: "Көмек орталығы",
                about_app: "Қолданба туралы",
                version: "Нұсқа 2.4.1"
            },
            settings: {
                display_appearance: "Көрсету және сыртқы түр",
                theme_mode: "Тақырып режимі",
                light: "Ашық",
                dark: "Қараңғы"
            },
            categories: {
                income: "Кіріс",
                expense: "Шығыс",
                add_category: "Санат қосу",
                edit_category: "Санатты өңдеу",
                add_new_category: "Жаңа санат қосу",
                title: "Атауы",
                description: "Сипаттамасы",
                select_icon: "Белгішені таңдаңыз",
                select_color: "Түсті таңдаңыз",
                category_exists: "Осы атаумен санат қазірдің өзінде бар",
                category_saved: "Санат сәтті сақталды",
                category_deleted: "Санат сәтті жойылды"
            },
            personal_info: {
                full_name: "Толық аты-жөні",
                email_address: "Email мекенжайы",
                phone_number: "Телефон нөмірі",
                date_of_birth: "Туылған күні",
                address: "Мекенжайы",
                tax_residence: "Салық резиденттігі",
                select_country: "Елді таңдаңыз",
                change_photo: "Фотосын өзгерту",
                save_changes: "Өзгерістерді сақтау",
                data_saved: "Деректер сәтті сақталды",
                photo_updated: "Фото сәтті жаңартылды",
                gallery_permission: "Галереяға қол жеткізу рұқсаты қажет"
            },
            notifications: {
                title: "Хабарландырулар",
                all: "Барлығы",
                transactions: "Транзакциялар",
                bills: "Шоттар",
                security: "Қауіпсіздік",
                today: "Бүгін",
                yesterday: "Кеше",
                earlier_week: "Осы аптада бұрын",
                large_transaction: "Ірі транзакция анықталды",
                upcoming_bill: "Келе жатқан төлем",
                new_device: "Жаңа құрылғыдан кіру",
                budget_goal: "Бюджет мақсаты орындалды",
                weekly_summary: "Апталық шығыстар қорытындысы"
            },
            privacy_policy: {
                title: "Құпиялылық саясаты",
                last_updated: "Соңғы жаңарту: 2025 жылғы 16 мамыр",
                intro: "FinanceApp-та біз сіздің құпиялылығыңызды қорғауды міндеттейміз.",
                info_collect: "Біз жинайтын ақпарат",
                how_use: "Ақпаратты қалай пайдаланамыз",
                data_security: "Деректер қауіпсіздігі",
                your_rights: "Сіздің құқықтарыңыз",
                contact_us: "Бізбен байланысыңыз"
            },
            forgot_password: {
                title: "Құпия сөзді қалпына келтіру",
                subtitle: "Сілтеме немесе қалпына келтіру кодын алу үшін email мекенжайыңызды енгізіңіз.",
                send_code: "Код жіберу",
                back_to_login: "← Кіруге оралу",
                new_password: "Жаңа құпия сөз",
                enter_code: "Код пен жаңа құпия сөзді енгізіңіз",
                code_from_email: "Email-дан келген код",
                new_password_field: "Жаңа құпия сөз",
                password_repeat: "Құпия сөзді қайталаңыз",
                confirm: "Растау",
                back_to_recovery: "← Құпия сөзді қалпына келтіруге оралу"
            },
            language_screen: {
                search_placeholder: "Тілдерді іздеу",
                current_language: "Ағымдағы тіл",
                all_languages: "Барлық тілдер",
                change_immediately: "Қолданба тілі таңдағаннан кейін бірден өзгереді"
            },
            budget: {
                title: "Бюджет",
                welcome: "Бюджет экранына қош келдіңіз"
            },
            reports: {
                title: "Есептер",
                welcome: "Есептер экранына қош келдіңіз"
            },
            transfer: {
                title: "Аударымдар",
                welcome: "Аударымдар экранына қош келдіңіз"
            }
        }
    }
};

const initI18n = () => {
    return i18n
        .use(initReactI18next)
        .init({
            lng: 'en',
            fallbackLng: 'en',
            debug: false, // Отключаем логи для продакшена
            resources,
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false,
            }
        });
};

initI18n();

export default i18n;