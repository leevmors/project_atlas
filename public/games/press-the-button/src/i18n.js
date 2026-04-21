// Menu, tutorial, briefing, and interaction-prompt translations, plus the
// shared `currentLang` binding that data modules (e.g. riddles.js) read from.
// Channel feed content (clocks, radar, typewriter, equation feed) is NOT
// translated — it's part of the puzzle and stays in its original script.

// Active UI language. Consumers import this as a live binding: when
// `setCurrentLang("ru")` runs, importers see the new value on next access.
export let currentLang = "en";

export function setCurrentLang(lang) {
  currentLang = lang;
}

export const I18N = {
  en: {
    "hud.menu": "Menu",
    "pause.kicker": "Paused",
    "pause.title": "PRESS THE BUTTON",
    "pause.body": "The desk will wait. Take a breath, then go back in when you're ready.",
    "pause.resume": "Resume Shift",
    "pause.restart": "Restart Shift",
    "pause.mainMenu": "Main Menu",
    "pause.howto": "How It Works",
    "menu.kicker": "PRESS THE BUTTON",
    "menu.title": "PRESS THE BUTTON",
    "menu.intro": "You're alone at a battered desk, staring into seven feeds on an old CRT. Most of the time nothing happens. Then a number slips, a word changes, a shape drifts, and you have to decide if this is the moment to press the button. The tablet tells you what matters. Your nerves decide whether you trust yourself.",
    "menu.firstRunNote": "First time here? Start with the tutorial.",
    "menu.wakeHint": "Sound starts after your first click.",
    "menu.begin": "Start Shift",
    "menu.tutorial": "Tutorial",
    "menu.howto": "How It Works",
    "howto.kicker": "Before You Start",
    "howto.title": "How It Works",
    "howto.close": "Back",
    "howto.body": `
      <h3>What You Are Doing</h3>
      <p>You are alone at the desk, watching seven live feeds on an old CRT. Most stages are quiet. Sometimes one small detail is wrong. Your job is to notice it and decide whether it really deserves the button.</p>
      <h3>Before You Decide</h3>
      <ul>
        <li>Read the tablet first. The rule on the tablet tells you what counts this stage.</li>
        <li>Scan the feeds with <code>Q</code> / <code>E</code> or the on-screen buttons on touch devices.</li>
        <li>If the rule says the anomaly should be reported, press <code>R</code> or the red button.</li>
        <li>If the rule says leave it alone, press <code>F</code> or Skip.</li>
      </ul>
      <h3>Important</h3>
      <ul>
        <li>One wrong decision ends the shift immediately.</li>
        <li>Stage 1 is always clean. After that, the mistakes get more subtle and harder to trust.</li>
        <li>The phone might help you, mislead you, or say nothing useful at all.</li>
        <li>The tablet rule matters more than your instinct. When the two disagree, trust the tablet.</li>
      </ul>
      <h3>The Feel Of It</h3>
      <p>This is not really about speed. It is about staying calm, checking carefully, and pressing the button only when the moment is truly right.</p>
    `,
    "tutorial.kicker": "Tutorial",
    "tutorial.progress": "Step {n} / {total}",
    "tutorial.stage1.title": "Read The Room",
    "tutorial.stage1.body": "This is how a clean shift looks. All seven feeds behave. Use Q / E to check every channel, then press F (Skip) when nothing is wrong.",
    "tutorial.stage1.hint.keyboard": "Cycle channels: Q / E    •    Clean? Press F (Skip)",
    "tutorial.stage1.hint.touch": "Scan feeds: Prev / Next    •    Clean? Tap Skip",
    "tutorial.stage2.title": "Spot The Anomaly",
    "tutorial.stage2.body": "One channel is wrong. A digit flickers, a word slips, a shape drifts. Find it, then press R (Red) to flag it.",
    "tutorial.stage2.hint.keyboard": "Find the wrong channel    •    Press R (Red)",
    "tutorial.stage2.hint.touch": "Find the wrong feed    •    Tap Red",
    "tutorial.stage3.title": "Obey The iPad",
    "tutorial.stage3.body": "The iPad riddle is law. Open it with I. Only press R if the riddle says to. Here, the riddle asks: press if you see any anomaly.",
    "tutorial.stage3.hint.keyboard": "Open iPad: I    •    Follow the riddle",
    "tutorial.stage3.hint.touch": "Open iPad: Note    •    Follow the riddle",
    "tutorial.complete.title": "Tutorial Complete",
    "tutorial.complete.body": "You are ready for the desk. The real shift has 18 stages and no second chances.",
    "tutorial.fail.retry": "Not quite. Take another look.",
    "prompt.default.keyboard": "Click the tablet to read the mission. Q / E scans the CRT. R / F decides.",
    "prompt.default.touch": "Tap Note to read the mission. Prev / Next scans the CRT. Red or Skip decides.",
    "prompt.red": "Press the red button only when the mission says the fault truly deserves it.",
    "prompt.skip": "Skip the stage when no anomaly is present, or when the mission forbids judgment.",
    "prompt.ipad.open.keyboard": "Click the tablet to zoom in and read the mission.",
    "prompt.ipad.open.touch": "Tap Note to lean into the mission tablet.",
    "prompt.ipad.close.keyboard": "Click the tablet again (or press Esc) to lean back.",
    "prompt.ipad.close.touch": "Tap Note again to lean back.",
    "prompt.phone.answer.keyboard": "The phone is ringing. Click to answer — or ignore it.",
    "prompt.phone.answer.touch": "The phone is ringing. Tap it to answer — or ignore it.",
    "prompt.phone.pickup.keyboard": "Pick up the receiver to dial out.",
    "prompt.phone.pickup.touch": "Tap the receiver to dial out.",
    "prompt.phone.hangup.keyboard": "Click again to hang up.",
    "prompt.phone.hangup.touch": "Tap again to hang up.",
    "prompt.ipad.decide.keyboard": "Reading the mission — press R / F when you have decided.",
    "prompt.ipad.decide.touch": "Reading the mission — tap Red or Skip when you decide.",
    "message.ipad.open.keyboard": "Reading the mission. Click again or press Esc to lean back.",
    "message.ipad.open.touch": "Reading the mission. Tap Note again to lean back.",
    "message.ipad.close": "Leaned back from the tablet.",
    "ending.restart": "Restart Shift",
    "ending.menu": "Main Menu",
    "ending.stay": "Stay In Room"
  },
  ru: {
    "hud.menu": "Меню",
    "pause.kicker": "Пауза",
    "pause.title": "PRESS THE BUTTON",
    "pause.body": "Стол подождет. Переведи дыхание и возвращайся, когда будешь готов.",
    "pause.resume": "Продолжить",
    "pause.restart": "Начать заново",
    "pause.mainMenu": "Главное меню",
    "pause.howto": "Как это работает",
    "menu.kicker": "PRESS THE BUTTON",
    "menu.title": "PRESS THE BUTTON",
    "menu.intro": "Ты сидишь один за потрепанным столом и смотришь в семь каналов старого ЭЛТ-монитора. Обычно все спокойно. А потом где-то съезжает цифра, меняется слово или что-то едва заметно плывет, и тебе нужно решить: это тот самый момент, когда пора нажать кнопку, или нет. Планшет говорит, что сейчас важно. Остальное решают твои нервы.",
    "menu.firstRunNote": "Если ты здесь впервые, лучше начать с обучения.",
    "menu.wakeHint": "Звук включится после первого клика.",
    "menu.begin": "Начать Смену",
    "menu.tutorial": "Обучение",
    "menu.howto": "Как Это Работает",
    "howto.kicker": "Перед Началом",
    "howto.title": "Как Это Работает",
    "howto.close": "Назад",
    "howto.body": `
      <h3>Что Здесь Происходит</h3>
      <p>Ты один за столом и смотришь на семь живых каналов старого ЭЛТ-монитора. Чаще всего все тихо. Иногда какая-то мелочь идет не так. Твоя задача — заметить это и понять, действительно ли сейчас нужно жать кнопку.</p>
      <h3>Перед Решением</h3>
      <ul>
        <li>Сначала смотри в планшет. Именно правило на планшете говорит, что считается правильным ответом на этом этапе.</li>
        <li>Просматривай каналы через <code>Q</code> / <code>E</code> или экранные кнопки на телефоне и планшете.</li>
        <li>Если по правилу аномалию нужно отмечать, жми <code>R</code> или красную кнопку.</li>
        <li>Если по правилу вмешиваться не нужно, жми <code>F</code> или Skip.</li>
      </ul>
      <h3>Важно Помнить</h3>
      <ul>
        <li>Одна ошибка сразу заканчивает смену.</li>
        <li>Первый этап всегда чистый. Дальше странности становятся все тоньше и неприятнее.</li>
        <li>Телефон может подсказать, запутать тебя или вообще не сказать ничего полезного.</li>
        <li>Планшет важнее интуиции. Если правило и ощущение спорят, верь правилу.</li>
      </ul>
      <h3>Как Это Ощущается</h3>
      <p>Это не игра на скорость. Здесь важнее не паниковать, смотреть внимательно и нажимать кнопку только тогда, когда ты действительно уверен, что момент пришел.</p>
    `,
    "tutorial.kicker": "Обучение",
    "tutorial.progress": "Шаг {n} / {total}",
    "tutorial.stage1.title": "Осмотрись",
    "tutorial.stage1.body": "Вот как выглядит чистая смена. Все семь каналов ведут себя нормально. Переключай их клавишами Q / E, а затем нажми F (Пропуск), раз ничего не нашёл.",
    "tutorial.stage1.hint.keyboard": "Каналы: Q / E    •    Чисто? Нажми F (Пропуск)",
    "tutorial.stage1.hint.touch": "Листай каналы: Prev / Next    •    Чисто? Нажми Skip",
    "tutorial.stage2.title": "Найди Аномалию",
    "tutorial.stage2.body": "Один из каналов ошибается. Цифра мигает, слово сдвигается, форма дрожит. Найди его и нажми R (Красная), чтобы пометить.",
    "tutorial.stage2.hint.keyboard": "Найди ошибку    •    Нажми R (Красная)",
    "tutorial.stage2.hint.touch": "Найди ошибку    •    Нажми Red",
    "tutorial.stage3.title": "Слушай Планшет",
    "tutorial.stage3.body": "Загадка планшета — закон. Открой его клавишей I. Нажимай красную, только если так велит загадка. Здесь: нажми, если видишь любую аномалию.",
    "tutorial.stage3.hint.keyboard": "Планшет: I    •    Следуй загадке",
    "tutorial.stage3.hint.touch": "Открой планшет: Note    •    Следуй загадке",
    "tutorial.complete.title": "Обучение Пройдено",
    "tutorial.complete.body": "Ты готов к столу. На настоящей смене 18 этапов и ни одного второго шанса.",
    "tutorial.fail.retry": "Не совсем. Посмотри ещё раз.",
    "prompt.default.keyboard": "Нажми на планшет, чтобы прочитать задание. Q / E листают ЭЛТ. R / F выносят вердикт.",
    "prompt.default.touch": "Нажми Note, чтобы прочитать задание. Prev / Next листают ЭЛТ. Red или Skip решают.",
    "prompt.red": "Нажимай красную кнопку только когда задание действительно требует тревогу.",
    "prompt.skip": "Пропускай этап, когда аномалии нет или когда задание запрещает вмешиваться.",
    "prompt.ipad.open.keyboard": "Нажми на планшет, чтобы приблизить и прочитать задание.",
    "prompt.ipad.open.touch": "Нажми Note, чтобы приблизить планшет с заданием.",
    "prompt.ipad.close.keyboard": "Нажми на планшет ещё раз или Esc, чтобы откинуться назад.",
    "prompt.ipad.close.touch": "Нажми Note ещё раз, чтобы откинуться назад.",
    "prompt.phone.answer.keyboard": "Телефон звонит. Нажми, чтобы ответить — или проигнорируй.",
    "prompt.phone.answer.touch": "Телефон звонит. Коснись его, чтобы ответить — или проигнорируй.",
    "prompt.phone.pickup.keyboard": "Сними трубку, чтобы позвонить.",
    "prompt.phone.pickup.touch": "Коснись трубки, чтобы позвонить.",
    "prompt.phone.hangup.keyboard": "Нажми ещё раз, чтобы повесить трубку.",
    "prompt.phone.hangup.touch": "Коснись ещё раз, чтобы повесить трубку.",
    "prompt.ipad.decide.keyboard": "Читай задание — жми R / F, когда решишь.",
    "prompt.ipad.decide.touch": "Читай задание — жми Red или Skip, когда решишь.",
    "message.ipad.open.keyboard": "Читаешь задание. Нажми ещё раз или Esc, чтобы откинуться назад.",
    "message.ipad.open.touch": "Читаешь задание. Нажми Note ещё раз, чтобы откинуться назад.",
    "message.ipad.close": "Ты откинулся от планшета.",
    "ending.restart": "Заново",
    "ending.menu": "Главное Меню",
    "ending.stay": "Остаться"
  }
};
