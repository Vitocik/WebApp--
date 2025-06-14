const menuHelper = require('Common.TelegramComponents.MenuHelper');
const md5 = require('Common.Utils.Md5');

// Получаем Telegram ID из лида
const telegramId = lead.getData('identification');

// Пытаемся найти пользователя по messenger_id
let user = table.find('users', [], [['messenger_id', '=', telegramId]]);

// Если пользователь не найден, создаём нового
if (user.length === 0) {
    let personId = lead.getData('person_id');

    // Создаём запись пользователя в таблице users
    const newUser = table.createItem('users', {
        messenger_id: telegramId,
        person_id: personId
    });

    user = [newUser];
}

// Подготовка приветственного сообщения
const welcomeMessage = 'Добро пожаловать! Для продолжения регистрации нажмите кнопку ниже 👇';

// Проверка: первый ли это вызов скрипта (при открытии меню)
if (menuHelper.isFirstImmediateCall()) {
    menuHelper.removeInlineKeyboard();
    menuHelper.clearLastTelegramMessageId();

    const formUrl = 'https://ncfu.dev.metabot24.com/';
    const buttons = [[{
        text: '🔗 Зарегистрироваться',
        web_app: { url: formUrl }
    }]];

    const apiParams = {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML'
    };

    menuHelper.sendMessage(welcomeMessage, null, null, apiParams);
    return false;
}

// Обработка payload с нажатой кнопки или командой
const payload = bot.getWebhookPayload();
const callbackData = payload?.callback_query?.data;

// Если нажата inline-кнопка
if (callbackData) {
    bot.runScriptByCodeForLead(callbackData, lead.getData('id'));
    bot.stop();
    return true;
}

// Обработка текстовых команд
const messageData = payload?.message;
if (messageData) {
    const command = messageData.text;

    if (command === '/web') {
        bot.runScriptByCodeForLead('registration-form', lead.getData('id'));
        bot.stop();
        return true;
    }

    if (command === '/start') {
        bot.runScriptByCodeForLead('start', lead.getData('id'));
        bot.stop();
        return true;
    }
}
