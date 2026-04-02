const pptxgen = require('pptxgenjs');
const html2pptx = require('/home/z/my-project/skills/pptx/scripts/html2pptx');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SLIDES_DIR = '/home/z/my-project/presentation/slides';
const OUTPUT_FILE = '/home/z/my-project/presentation/СПС_Голосовая_Студия.pptx';
const METRO_LOGO = '/home/z/my-project/public/metro-logo.png'; // Логотип из приложения

// Создаём градиентный фон
async function createGradientBg(filename, color1, color2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(filename);
  return filename;
}

// Создаём иконки
async function createIcon(filename, svgContent) {
  await sharp(Buffer.from(svgContent)).png().toFile(filename);
  return filename;
}

// HTML для слайда 1: Титульный
function createSlide1HTML(bgPath, metroIcon) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #0066CC; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background-image: url('${bgPath}');
  background-size: cover;
}
.logo { margin-bottom: 15pt; }
.title {
  color: #FFFFFF;
  font-size: 42pt;
  font-weight: bold;
  text-align: center;
  margin: 0 0 8pt 0;
}
.subtitle {
  color: #FFFFFF;
  font-size: 18pt;
  text-align: center;
  margin: 0 0 10pt 0;
  opacity: 0.95;
}
.org {
  color: #FFFFFF;
  font-size: 12pt;
  text-align: center;
  margin: 0 0 4pt 0;
  opacity: 0.85;
}
.slogan {
  color: #FFFFFF;
  font-size: 14pt;
  font-style: italic;
  text-align: center;
  margin-top: 20pt;
  opacity: 0.9;
}
.line {
  width: 180pt;
  height: 2pt;
  background: #FFFFFF;
  margin: 12pt 0;
  opacity: 0.5;
}
</style>
</head>
<body>
<div class="logo">
  <img src="${metroIcon}" style="width: 70pt; height: 70pt;">
</div>
<h1 class="title">СПС Голосовая Студия</h1>
<div class="line"></div>
<p class="subtitle">Профессиональная система синтеза речи</p>
<p class="org">Служба пассажирских сервисов</p>
<p class="org">ГУП «Петербургский метрополитен»</p>
<p class="slogan">Объединяем город, сближаем людей</p>
</body>
</html>`;
}

// HTML для слайда 2: О проекте
function createSlide2HTML(speakerIcon) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #FFFFFF; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background: #FFFFFF;
}
.header {
  background: #0066CC;
  padding: 15pt 30pt;
}
.header-title {
  color: #FFFFFF;
  font-size: 24pt;
  font-weight: bold;
  margin: 0;
}
.content {
  display: flex;
  flex: 1;
  padding: 20pt 30pt;
}
.left-col { flex: 1; padding-right: 20pt; }
.right-col {
  flex: 0.8;
  display: flex;
  justify-content: center;
  align-items: center;
}
.description {
  color: #333333;
  font-size: 12pt;
  line-height: 1.5;
  margin: 0 0 15pt 0;
}
.feature-box {
  background: #F5F7FA;
  border-left: 3pt solid #0066CC;
  padding: 10pt 15pt;
  margin: 8pt 0;
}
.feature-title {
  color: #0066CC;
  font-size: 12pt;
  font-weight: bold;
  margin: 0 0 3pt 0;
}
.feature-text {
  color: #555555;
  font-size: 10pt;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="header-title">О проекте</h1>
</div>
<div class="content">
  <div class="left-col">
    <p class="description">СПС Голосовая Студия — веб-приложение для профессионального синтеза речи с российскими голосами и стандартом АИ-22.</p>
    <div class="feature-box">
      <p class="feature-title">8 голосов</p>
      <p class="feature-text">Мужские и женские с эмоциями</p>
    </div>
    <div class="feature-box">
      <p class="feature-title">Стандарт АИ-22</p>
      <p class="feature-text">Профессиональное качество</p>
    </div>
    <div class="feature-box">
      <p class="feature-title">Telegram</p>
      <p class="feature-text">Автоотправка анонсов</p>
    </div>
  </div>
  <div class="right-col">
    <img src="${speakerIcon}" style="width: 120pt; height: 120pt; opacity: 0.7;">
  </div>
</div>
</body>
</html>`;
}

// HTML для слайда 3: Возможности
function createSlide3HTML() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #FFFFFF; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background: #FFFFFF;
}
.header {
  background: #0066CC;
  padding: 12pt 30pt;
}
.header-title {
  color: #FFFFFF;
  font-size: 22pt;
  font-weight: bold;
  margin: 0;
}
.content {
  display: flex;
  flex-wrap: wrap;
  padding: 12pt 20pt;
  gap: 10pt;
}
.card {
  width: 200pt;
  background: #F5F7FA;
  border-radius: 4pt;
  padding: 8pt;
  border-top: 2pt solid #0066CC;
}
.card-icon {
  font-size: 18pt;
  margin-bottom: 4pt;
}
.card-title {
  color: #0066CC;
  font-size: 10pt;
  font-weight: bold;
  margin: 0 0 2pt 0;
}
.card-text {
  color: #555555;
  font-size: 8pt;
  line-height: 1.2;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="header-title">Возможности</h1>
</div>
<div class="content">
  <div class="card">
    <p class="card-icon">🎤</p>
    <p class="card-title">Синтез речи</p>
    <p class="card-text">Генерация аудио из текста</p>
  </div>
  <div class="card">
    <p class="card-icon">🎭</p>
    <p class="card-title">Эмоции</p>
    <p class="card-text">Разные стили произношения</p>
  </div>
  <div class="card">
    <p class="card-icon">📊</p>
    <p class="card-title">История</p>
    <p class="card-text">Сохранение генераций</p>
  </div>
  <div class="card">
    <p class="card-icon">📱</p>
    <p class="card-title">PWA</p>
    <p class="card-text">Установка как приложение</p>
  </div>
  <div class="card">
    <p class="card-icon">🔒</p>
    <p class="card-title">Безопасность</p>
    <p class="card-text">Защита паролем</p>
  </div>
  <div class="card">
    <p class="card-icon">📤</p>
    <p class="card-title">Telegram</p>
    <p class="card-text">Интеграция для анонсов</p>
  </div>
</div>
</body>
</html>`;
}

// HTML для слайда 4: Голоса
function createSlide4HTML() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #FFFFFF; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background: #FFFFFF;
}
.header {
  background: #0066CC;
  padding: 12pt 30pt;
}
.header-title {
  color: #FFFFFF;
  font-size: 22pt;
  font-weight: bold;
  margin: 0;
}
.content {
  display: flex;
  padding: 12pt 25pt;
  gap: 20pt;
}
.col { flex: 1; }
.section-header {
  border-bottom: 2pt solid #0066CC;
  margin-bottom: 10pt;
  padding-bottom: 4pt;
}
.section-title {
  color: #0066CC;
  font-size: 13pt;
  font-weight: bold;
  margin: 0;
}
.voice-item {
  display: flex;
  align-items: center;
  margin: 6pt 0;
  padding: 5pt 8pt;
  background: #F5F7FA;
  border-radius: 4pt;
}
.voice-emoji {
  font-size: 14pt;
  margin-right: 8pt;
}
.voice-name {
  color: #333333;
  font-size: 10pt;
  font-weight: bold;
  margin: 0;
  flex: 1;
}
.voice-desc {
  color: #777777;
  font-size: 9pt;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="header-title">Доступные голоса</h1>
</div>
<div class="content">
  <div class="col">
    <div class="section-header">
      <p class="section-title">Мужские голоса</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">👨‍💼</p>
      <p class="voice-name">Дмитрий</p>
      <p class="voice-desc">Профессиональный</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">🎙️</p>
      <p class="voice-name">Дмитрий Pro</p>
      <p class="voice-desc">С эмоциями</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">🧔</p>
      <p class="voice-name">Олег</p>
      <p class="voice-desc">С характером</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">🎩</p>
      <p class="voice-name">Филипп</p>
      <p class="voice-desc">Спокойный</p>
    </div>
  </div>
  <div class="col">
    <div class="section-header">
      <p class="section-title">Женские голоса</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">👩‍💼</p>
      <p class="voice-name">Светлана</p>
      <p class="voice-desc">Профессиональный</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">🎤</p>
      <p class="voice-name">Светлана Pro</p>
      <p class="voice-desc">С эмоциями</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">👩</p>
      <p class="voice-name">Алёна</p>
      <p class="voice-desc">Мягкий</p>
    </div>
    <div class="voice-item">
      <p class="voice-emoji">👨</p>
      <p class="voice-name">Айдар</p>
      <p class="voice-desc">Silero TTS</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// HTML для слайда 5: Стандарт АИ-22
function createSlide5HTML(standardIcon) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #FFFFFF; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background: #FFFFFF;
}
.header {
  background: #0066CC;
  padding: 15pt 30pt;
}
.header-title {
  color: #FFFFFF;
  font-size: 24pt;
  font-weight: bold;
  margin: 0;
}
.content {
  display: flex;
  padding: 18pt 30pt;
  gap: 25pt;
}
.left-col { flex: 1.2; }
.right-col {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.spec-group { margin-bottom: 12pt; }
.spec-title {
  color: #0066CC;
  font-size: 12pt;
  font-weight: bold;
  margin: 0 0 6pt 0;
}
.spec-row {
  display: flex;
  padding: 4pt 0;
  border-bottom: 1pt solid #EEEEEE;
}
.spec-label {
  color: #666666;
  font-size: 10pt;
  width: 120pt;
  margin: 0;
}
.spec-value {
  color: #333333;
  font-size: 10pt;
  font-weight: bold;
  margin: 0;
}
.badge {
  background: #0066CC;
  color: #FFFFFF;
  padding: 12pt 20pt;
  border-radius: 6pt;
  text-align: center;
  margin-top: 12pt;
}
.badge-title {
  font-size: 10pt;
  margin: 0 0 4pt 0;
}
.badge-value {
  font-size: 16pt;
  font-weight: bold;
  margin: 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="header-title">Стандарт АИ-22</h1>
</div>
<div class="content">
  <div class="left-col">
    <div class="spec-group">
      <p class="spec-title">Формат аудио</p>
      <div class="spec-row">
        <p class="spec-label">Формат</p>
        <p class="spec-value">MP3</p>
      </div>
      <div class="spec-row">
        <p class="spec-label">Частота</p>
        <p class="spec-value">44100 Гц</p>
      </div>
      <div class="spec-row">
        <p class="spec-label">Битрейт</p>
        <p class="spec-value">CBR 128 кбит/с</p>
      </div>
      <div class="spec-row">
        <p class="spec-label">Кодек</p>
        <p class="spec-value">LAME</p>
      </div>
      <div class="spec-row">
        <p class="spec-label">Каналы</p>
        <p class="spec-value">Моно</p>
      </div>
    </div>
    <div class="spec-group">
      <p class="spec-title">Нормализация</p>
      <div class="spec-row">
        <p class="spec-label">LUFS</p>
        <p class="spec-value">-23 ±0.5 LU</p>
      </div>
      <div class="spec-row">
        <p class="spec-label">True Peak</p>
        <p class="spec-value">≤ -1 dBTP</p>
      </div>
      <div class="spec-row">
        <p class="spec-label">LRA</p>
        <p class="spec-value">≤ 5 LU</p>
      </div>
    </div>
  </div>
  <div class="right-col">
    <img src="${standardIcon}" style="width: 80pt; height: 80pt; opacity: 0.7;">
    <div class="badge">
      <p class="badge-title">Профессиональный стандарт</p>
      <p class="badge-value">АИ-22</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// HTML для слайда 6: Telegram
function createSlide6HTML(telegramIcon) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #FFFFFF; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background: #FFFFFF;
}
.header {
  background: #0066CC;
  padding: 12pt 30pt;
}
.header-title {
  color: #FFFFFF;
  font-size: 22pt;
  font-weight: bold;
  margin: 0;
}
.content {
  display: flex;
  padding: 15pt 30pt;
  gap: 20pt;
  align-items: center;
}
.left-col { flex: 1; }
.right-col {
  flex: 0.8;
  display: flex;
  justify-content: center;
  align-items: center;
}
.desc {
  color: #333333;
  font-size: 11pt;
  line-height: 1.3;
  margin: 0 0 12pt 0;
}
.feature-item {
  display: flex;
  align-items: center;
  margin: 6pt 0;
  padding: 6pt 10pt;
  background: #F5F7FA;
  border-radius: 4pt;
  border-left: 3pt solid #0066CC;
}
.feature-text {
  color: #333333;
  font-size: 10pt;
  margin: 0;
}
.check {
  color: #0066CC;
  font-size: 12pt;
  margin-right: 8pt;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="header-title">Telegram интеграция</h1>
</div>
<div class="content">
  <div class="left-col">
    <p class="desc">Автоматическая отправка аудиосообщений в Telegram-каналы.</p>
    <div class="feature-item">
      <p class="check">✓</p>
      <p class="feature-text">Настройка бота и канала</p>
    </div>
    <div class="feature-item">
      <p class="check">✓</p>
      <p class="feature-text">Автоотправка анонсов</p>
    </div>
    <div class="feature-item">
      <p class="check">✓</p>
      <p class="feature-text">Отправка с текстом или без</p>
    </div>
    <div class="feature-item">
      <p class="check">✓</p>
      <p class="feature-text">История всех отправок</p>
    </div>
  </div>
  <div class="right-col">
    <img src="${telegramIcon}" style="width: 100pt; height: 100pt; opacity: 0.8;">
  </div>
</div>
</body>
</html>`;
}

// HTML для слайда 7: Инструкция
function createSlide7HTML() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #FFFFFF; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  background: #FFFFFF;
}
.header {
  background: #0066CC;
  padding: 12pt 30pt;
}
.header-title {
  color: #FFFFFF;
  font-size: 22pt;
  font-weight: bold;
  margin: 0;
}
.content {
  display: flex;
  padding: 15pt 25pt;
  gap: 20pt;
}
.col { flex: 1; }
.step {
  display: flex;
  align-items: flex-start;
  margin: 8pt 0;
  padding: 8pt 10pt;
  background: #F5F7FA;
  border-radius: 4pt;
  border-left: 3pt solid #0066CC;
}
.step-num {
  background: #0066CC;
  color: #FFFFFF;
  font-size: 11pt;
  font-weight: bold;
  width: 20pt;
  height: 20pt;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10pt;
  flex-shrink: 0;
}
.step-text {
  color: #333333;
  font-size: 10pt;
  line-height: 1.3;
  margin: 0;
}
.section-title {
  color: #0066CC;
  font-size: 12pt;
  font-weight: bold;
  margin: 0 0 10pt 0;
}
</style>
</head>
<body>
<div class="header">
  <h1 class="header-title">Инструкция по использованию</h1>
</div>
<div class="content">
  <div class="col">
    <p class="section-title">Создание аудио</p>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">1</p></div>
      <p class="step-text">Выберите голос из списка (мужской/женский)</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">2</p></div>
      <p class="step-text">Выберите эмоцию (нейтральный, весёлый и др.)</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">3</p></div>
      <p class="step-text">Введите текст (до 5000 символов)</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">4</p></div>
      <p class="step-text">Настройте скорость и громкость</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">5</p></div>
      <p class="step-text">Нажмите «Сгенерировать»</p>
    </div>
  </div>
  <div class="col">
    <p class="section-title">Дополнительные функции</p>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">6</p></div>
      <p class="step-text">Прослушайте результат встроенным плеером</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">7</p></div>
      <p class="step-text">Скачайте MP3 файл на устройство</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">8</p></div>
      <p class="step-text">Отправьте в Telegram (если настроен)</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">9</p></div>
      <p class="step-text">История генераций сохраняется автоматически</p>
    </div>
    <div class="step">
      <div class="step-num"><p style="margin:0;color:#fff;font-size:10pt;">10</p></div>
      <p class="step-text">Установите PWA для быстрого доступа</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// HTML для слайда 8: Заключительный
function createSlide8HTML(bgPath, metroIcon) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
html { background: #0066CC; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background-image: url('${bgPath}');
  background-size: cover;
}
.logo { margin-bottom: 15pt; }
.title {
  color: #FFFFFF;
  font-size: 32pt;
  font-weight: bold;
  text-align: center;
  margin: 0 0 10pt 0;
}
.subtitle {
  color: #FFFFFF;
  font-size: 16pt;
  text-align: center;
  margin: 0 0 20pt 0;
  opacity: 0.9;
}
.org {
  color: #FFFFFF;
  font-size: 12pt;
  text-align: center;
  margin: 0 0 5pt 0;
  opacity: 0.85;
}
.slogan {
  color: #FFFFFF;
  font-size: 14pt;
  font-style: italic;
  text-align: center;
  margin-top: 20pt;
  opacity: 0.8;
}
.line {
  width: 120pt;
  height: 2pt;
  background: #FFFFFF;
  margin: 15pt 0;
  opacity: 0.4;
}
</style>
</head>
<body>
<div class="logo">
  <img src="${metroIcon}" style="width: 60pt; height: 60pt;">
</div>
<h1 class="title">СПС Голосовая Студия</h1>
<div class="line"></div>
<p class="subtitle">Спасибо за внимание!</p>
<p class="org">Служба пассажирских сервисов</p>
<p class="org">ГУП «Петербургский метрополитен»</p>
<p class="slogan">Объединяем город, сближаем людей</p>
</body>
</html>`;
}

async function main() {
  console.log('🎨 Создание презентации СПС Голосовая Студия...\n');
  
  console.log('📦 Генерация ресурсов...');
  const bgPath = path.join(SLIDES_DIR, 'bg-gradient.png');
  const speakerIcon = path.join(SLIDES_DIR, 'speaker-icon.png');
  const telegramIcon = path.join(SLIDES_DIR, 'telegram-icon.png');
  const standardIcon = path.join(SLIDES_DIR, 'standard-icon.png');
  
  await createGradientBg(bgPath, '#0066CC', '#003366');
  
  await createIcon(speakerIcon, `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#0066CC"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`);
  await createIcon(telegramIcon, `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#0066CC"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`);
  await createIcon(standardIcon, `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#0066CC"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`);
  console.log('✅ Ресурсы созданы\n');
  
  console.log('📝 Создание HTML слайдов...');
  const slides = [
    { name: 'slide1.html', content: createSlide1HTML(bgPath, METRO_LOGO) },
    { name: 'slide2.html', content: createSlide2HTML(speakerIcon) },
    { name: 'slide3.html', content: createSlide3HTML() },
    { name: 'slide4.html', content: createSlide4HTML() },
    { name: 'slide5.html', content: createSlide5HTML(standardIcon) },
    { name: 'slide6.html', content: createSlide6HTML(telegramIcon) },
    { name: 'slide7.html', content: createSlide7HTML() },
    { name: 'slide8.html', content: createSlide8HTML(bgPath, METRO_LOGO) }
  ];
  
  for (const slide of slides) {
    fs.writeFileSync(path.join(SLIDES_DIR, slide.name), slide.content);
    console.log(`   ${slide.name}`);
  }
  console.log('✅ HTML слайды созданы\n');
  
  console.log('🔧 Конвертация в PowerPoint...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'ГУП Петербургский метрополитен';
  pptx.title = 'СПС Голосовая Студия';
  pptx.subject = 'Презентация системы синтеза речи';
  pptx.company = 'ГУП Петербургский метрополитен';
  
  for (let i = 0; i < slides.length; i++) {
    const htmlPath = path.join(SLIDES_DIR, slides[i].name);
    await html2pptx(htmlPath, pptx);
    console.log(`   Слайд ${i + 1}/${slides.length}`);
  }
  
  await pptx.writeFile({ fileName: OUTPUT_FILE });
  console.log(`\n✅ Презентация создана: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
