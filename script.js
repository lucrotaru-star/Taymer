/* Приложение помещено в IIFE, чтобы не создавать глобальные переменные. */
(() => {
  'use strict';

  const STORAGE_KEY = 'soon-event-v1';
  const presets = { birthday: 'День рождения', vacation: 'Каникулы', newyear: 'Новый год' };
  const facts = [
    'Осьминог имеет три сердца, а его кровь голубая — совсем как у супергероя из морских глубин.',
    'Бананы — это ягоды, а клубника с точки зрения ботаники ягодой не считается.',
    'В космосе невозможно плакать по-настоящему: слёзы не падают, а собираются в маленькие шарики.',
    'У пчёл есть пять глаз: два больших и три маленьких на макушке.',
    'Молния может быть горячее поверхности Солнца — её температура достигает примерно 30 000 °C.',
    'В мире есть деревья, которые старше египетских пирамид. Они растут до сих пор!'
  ];
  const quotes = [
    'Большая мечта начинается с маленького шага. Сегодня — отличный день его сделать.',
    'Не откладывай радость: иногда она уже прячется в обычном дне.',
    'Если задача кажется огромной, начни с самого маленького кусочка. Это уже победа.',
    'Ты не обязан быть идеальным. Достаточно быть чуть смелее, чем вчера.',
    'Будущее любит тех, кто умеет ждать, но ещё больше — тех, кто действует.',
    'Даже самый длинный обратный отсчёт однажды показывает ноль.'
  ];

  const el = {
    title: document.querySelector('#event-title'), date: document.querySelector('#event-date'), status: document.querySelector('#timer-status'),
    days: document.querySelector('#days'), hours: document.querySelector('#hours'), minutes: document.querySelector('#minutes'), seconds: document.querySelector('#seconds'),
    form: document.querySelector('#event-form'), dateInput: document.querySelector('#event-input-date'), customName: document.querySelector('#custom-name'),
    customNameField: document.querySelector('#custom-name-field'), message: document.querySelector('#form-message'), modal: document.querySelector('#confirm-modal'),
    modalDescription: document.querySelector('#modal-description'), confirm: document.querySelector('#confirm-button'), cancel: document.querySelector('#cancel-button'),
    fact: document.querySelector('#fact-text'), quote: document.querySelector('#quote-text'), stamp: document.querySelector('#day-stamp'), pictureTitle: document.querySelector('#picture-title')
  };
  let currentEvent;
  let pendingEvent;

  function localDateString(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }

  function getNextNewYear() {
    const now = new Date();
    const year = now.getFullYear() + 1;
    return `${year}-01-01`;
  }

  function getDefaultDate(type) {
    const now = new Date();
    if (type === 'newyear') return getNextNewYear();
    if (type === 'vacation') {
      const summer = new Date(now.getFullYear(), 5, 1);
      return localDateString(summer > now ? summer : new Date(now.getFullYear() + 1, 5, 1));
    }
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return localDateString(nextWeek);
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${dateString}T00:00:00`));
  }

  function selectDailyText() {
    // Один и тот же номер дня даёт один результат: карточки меняются каждое утро.
    const today = new Date();
    const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
    el.fact.textContent = facts[dayNumber % facts.length];
    el.quote.textContent = `«${quotes[(dayNumber * 3 + 1) % quotes.length]}»`;
    el.stamp.textContent = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(today);
  }

  function updateTimer() {
    const eventTime = new Date(`${currentEvent.date}T00:00:00`).getTime();
    const difference = eventTime - Date.now();
    if (difference <= 0) {
      el.days.textContent = '000'; el.hours.textContent = '00'; el.minutes.textContent = '00'; el.seconds.textContent = '00';
      el.status.textContent = 'Событие уже наступило!';
      return;
    }
    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    el.days.textContent = String(days).padStart(3, '0');
    el.hours.textContent = String(hours).padStart(2, '0');
    el.minutes.textContent = String(minutes).padStart(2, '0');
    el.seconds.textContent = String(seconds).padStart(2, '0');
    el.status.textContent = days === 0 ? 'Уже сегодня — всё получится!' : 'Готовимся к чуду!';
  }

  function renderEvent() {
    el.title.textContent = currentEvent.title;
    el.date.textContent = formatDate(currentEvent.date);
    el.pictureTitle.textContent = currentEvent.title === 'Новый год' ? 'Вперёд к чуду' : `Навстречу: ${currentEvent.title}`;
    updateTimer();
  }

  function setSelectedType(type) {
    const radio = document.querySelector(`input[name="event-type"][value="${type}"]`);
    if (radio) radio.checked = true;
    el.customNameField.hidden = type !== 'custom';
    if (type !== 'custom') el.customName.value = '';
    if (!el.dateInput.value || type !== 'custom') el.dateInput.value = getDefaultDate(type);
  }

  function openModal(eventData) {
    pendingEvent = eventData;
    el.modalDescription.textContent = `Таймер будет отсчитывать время до события «${eventData.title}» (${formatDate(eventData.date)}).`;
    el.modal.classList.add('is-open');
    el.modal.setAttribute('aria-hidden', 'false');
    el.confirm.focus();
  }

  function closeModal() {
    el.modal.classList.remove('is-open');
    el.modal.setAttribute('aria-hidden', 'true');
    pendingEvent = null;
  }

  document.querySelectorAll('input[name="event-type"]').forEach((radio) => {
    radio.addEventListener('change', () => setSelectedType(radio.value));
  });

  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    el.message.textContent = '';
    const type = document.querySelector('input[name="event-type"]:checked').value;
    const title = type === 'custom' ? el.customName.value.trim() : presets[type];
    if (!title) { el.message.textContent = 'Введите название своего события.'; el.customName.focus(); return; }
    if (!el.dateInput.value) { el.message.textContent = 'Выберите дату события.'; el.dateInput.focus(); return; }
    openModal({ title, date: el.dateInput.value, type });
  });

  el.confirm.addEventListener('click', () => {
    currentEvent = pendingEvent;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEvent));
    renderEvent();
    closeModal();
  });
  el.cancel.addEventListener('click', closeModal);
  el.modal.addEventListener('click', (event) => { if (event.target === el.modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && el.modal.classList.contains('is-open')) closeModal(); });

  function loadSavedEvent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  const saved = loadSavedEvent();
  currentEvent = saved && saved.title && saved.date ? saved : { title: 'Новый год', date: getNextNewYear(), type: 'newyear' };
  setSelectedType(currentEvent.type || 'custom');
  el.dateInput.value = currentEvent.date;
  if ((currentEvent.type || 'custom') === 'custom') el.customName.value = currentEvent.title;
  selectDailyText();
  renderEvent();
  window.setInterval(updateTimer, 1000);
})();
