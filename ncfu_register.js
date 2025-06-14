snippet('Business.Helpers.Response');

// Функция для генерации хэша
function generateHash(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}


const isUpdate = !!request.json.leadHash;
let missingParams = [];

if (!request.json || 
    (!isUpdate && !request.json.telegramId) || 
    !request.json.last_name || 
    !request.json.first_name || 
    (!isUpdate && !request.json.email) || 
    (!isUpdate && !request.json.phone)) {
    
    let missingParams = [];
    if (!request.json) {
        return getErrorResponse("Некорректный JSON в запросе");
    }
    if (!isUpdate && !request.json.telegramId) missingParams.push("telegramId");
    if (!request.json.last_name) missingParams.push("last_name");
    if (!request.json.first_name) missingParams.push("first_name");
    if (!isUpdate && !request.json.email) missingParams.push("email");
    if (!isUpdate && !request.json.phone) missingParams.push("phone");

    return getErrorResponse(`Отсутствуют обязательные параметры: ${missingParams.join(', ')}`);
}

// Извлекаем данные из request.json
let telegramId = request.json.telegramId;
let surname = request.json.last_name;
let firstname = request.json.first_name;
let patronymic = request.json.patronymic || '';
let email = request.json.email;
let phone = request.json.phone;
let comment = request.json.comment || '';

// Проверяем, существует ли пользователь с таким telegramId
let existingUser = table.find('users', [], [['messenger_id', '=', telegramId]]);
if (existingUser && existingUser.length > 0) {
    return getErrorResponse('Пользователь с таким telegramId уже зарегистрирован');
}

// Валидация email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    return getErrorResponse('Неверный формат email');
}


// Валидация телефона
let phoneDigits = phone.toString().replace(/\D/g, ''); // Удаляем все нецифровые символы
console.log("Исходный phone:", phone); // Отладочный вывод
console.log("phoneDigits после обработки:", phoneDigits); // Отладочный вывод

// Если номер начинается с 7, заменяем на 8
if (phoneDigits.startsWith('7') && phoneDigits.length === 11) {
    phoneDigits = '8' + phoneDigits.slice(1);
}

// Проверяем длину и начало номера
if (phoneDigits.length !== 11 || !phoneDigits.startsWith('8')) {
    return getErrorResponse('Неверный формат телефона. Ожидается 11 цифр, начинающихся с 8 (например, 89620102290)');
}
let formattedPhone = phoneDigits; // Сохраняем в формате 89620102290



// Валидация comment (если передан, это роль)
const validRoles = ['student', 'applicant', 'staff'];
if (comment && !validRoles.includes(comment)) {
    return getErrorResponse('Неверная роль. Допустимые роли: student, applicant, staff');
}


// Форматирование ФИО
function formatString(str) {
    if (!str) return '';
    return str
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

let formattedSurname = formatString(surname);
let formattedFirstname = formatString(firstname);
let formattedPatronymic = formatString(patronymic);

// Создаём запись в таблице users
let user;
try {
    user = table.createItem('users', {
        messenger_id: telegramId,
        last_name: formattedSurname,
        first_name: formattedFirstname,
        patronymic: formattedPatronymic,
        email: email,
        phone: phone,
        comment: comment,
        created_at: new Date().toISOString()
    });
} catch (e) {
    return getErrorResponse("Ошибка при создании пользователя", e.toString());
}

if (!user || !user.id) {
    return getErrorResponse("Пользователь не был создан (неверный ответ от table.createItem)");
}

let leadHash = generateHash();
// Возвращаем успешный ответ
return getSuccessResponse({
    id: user.id,
    leadHash: leadHash,
    message: `Спасибо за регистрацию, ${formattedFirstname}! Ваш запрос ожидает модерации.`
});
