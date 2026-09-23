// CET6 Tutor - Host code (function body returning a Cordis Plugin)
// All side effects (data fetch, RPC, tools, timer) must live inside apply(ctx).

return {
  inject: ['timer', 'web', 'fs', 'shell'],
  apply(ctx) {
    const DATA_REPO = 'https://raw.githubusercontent.com/202704948-design/astrbot_plugin_cet6/master';
    const EBBING = [12 * 3600, 24 * 3600, 2 * 86400, 4 * 86400, 7 * 86400, 15 * 86400];
    const RANKS = ['待定 🥚', '模糊 📉', '清晰 📈', '记住 🧠', '牢固 🛡️', '掌握 🌟', '精通 👑'];
    const USER_ID = 'self';

    // ===== Upstream fixes (auto-repair layer) =====
    // KNOWN_MP3S: verified list of MP3 filenames present in the upstream
    //   'CET-6听力/' directory. Used to back-fill mp3_file when listening.json
    //   has meta=null (e.g. 2023_03_1, 2022_06_1).
    const KNOWN_MP3S = new Set([
        '2019_06_1','2019_06_2','2019_12_1','2019_12_2',
        '2020_07_1','2020_09_1','2020_12_1','2020_12_2',
        '2021_06_1','2021_06_2','2021_12_1','2021_12_2',
        '2022_06_1','2022_09_1','2022_12_1','2022_12_2',
        '2023_03_1','2023_06_1','2023_06_2',
        '2023_12_1','2023_12_2',
        '2024_06_1','2024_06_2','2024_12_1','2024_12_2',
        '2025_06_1','2025_06_2'
      ]);
    // LISTENING_ANSWER_OVERRIDES: authoritative answers from
    //   Drhm1224/cet6-all-in-one (cross-validated 2024-09).
    //   Used to repair upstream's 30 garbage letters (E/F/G/H/I/J/K/L/M/N/O)
    //   in 2025_06_2, 2024_06_2, 2023_12_1.
    const LISTENING_ANSWER_OVERRIDES = Object.create(null);
    LISTENING_ANSWER_OVERRIDES['2023_06_1'] = {"1":"B","2":"B","3":"C","4":"A","5":"D","6":"C","7":"A","8":"D","9":"A","10":"B","11":"D","12":"C","13":"D","14":"B","15":"C","16":"A","17":"C","18":"B","19":"D","20":"C","21":"B","22":"D","23":"A","24":"D","25":"A"};
    LISTENING_ANSWER_OVERRIDES['2023_06_2'] = {"1":"D","2":"A","3":"C","4":"B","5":"D","6":"C","7":"D","8":"A","9":"A","10":"B","11":"C","12":"A","13":"B","14":"D","15":"C","16":"D","17":"A","18":"C","19":"C","20":"B","21":"C","22":"B","23":"B","24":"A","25":"D"};
    LISTENING_ANSWER_OVERRIDES['2023_12_1'] = {"1":"B","2":"C","3":"A","4":"D","5":"D","6":"C","7":"D","8":"B","9":"D","10":"A","11":"C","12":"B","13":"A","14":"D","15":"C","16":"A","17":"B","18":"B","19":"C","20":"B","21":"D","22":"A","23":"D","24":"C","25":"C"};
    LISTENING_ANSWER_OVERRIDES['2023_12_2'] = {"1":"D","2":"A","3":"C","4":"B","5":"A","6":"A","7":"B","8":"C","9":"B","10":"D","11":"C","12":"A","13":"B","14":"D","15":"A","16":"A","17":"B","18":"D","19":"B","20":"A","21":"C","22":"D","23":"B","24":"A","25":"A"};
    LISTENING_ANSWER_OVERRIDES['2023_12_3'] = {"1":"D","2":"A","3":"C","4":"C","5":"D","6":"A","7":"B","8":"D","9":"D","10":"B","11":"A","12":"A","13":"D","14":"D","15":"B","16":"D","17":"B","18":"B","19":"C","20":"D","21":"C","22":"C","23":"A","24":"D","25":"A"};
    LISTENING_ANSWER_OVERRIDES['2024_06_1'] = {"1":"D","2":"B","3":"C","4":"A","5":"A","6":"B","7":"D","8":"C","9":"A","10":"B","11":"B","12":"D","13":"C","14":"C","15":"D","16":"A","17":"C","18":"B","19":"A","20":"B","21":"D","22":"D","23":"A","24":"D","25":"C"};
    LISTENING_ANSWER_OVERRIDES['2024_06_2'] = {"1":"D","2":"C","3":"A","4":"B","5":"D","6":"C","7":"D","8":"A","9":"A","10":"D","11":"B","12":"B","13":"C","14":"D","15":"C","16":"D","17":"A","18":"C","19":"C","20":"B","21":"C","22":"B","23":"B","24":"A","25":"D"};
    LISTENING_ANSWER_OVERRIDES['2024_12_1'] = {"1":"B","2":"A","3":"C","4":"C","5":"A","6":"B","7":"A","8":"D","9":"A","10":"B","11":"B","12":"D","13":"C","14":"C","15":"D","16":"A","17":"C","18":"B","19":"A","20":"B","21":"D","22":"D","23":"A","24":"D","25":"C"};
    LISTENING_ANSWER_OVERRIDES['2024_12_2'] = {"1":"A","2":"C","3":"A","4":"B","5":"D","6":"C","7":"D","8":"A","9":"A","10":"D","11":"B","12":"B","13":"C","14":"D","15":"C","16":"D","17":"A","18":"C","19":"C","20":"B","21":"C","22":"B","23":"B","24":"A","25":"D"};
    LISTENING_ANSWER_OVERRIDES['2024_12_3'] = {"1":"D","2":"C","3":"A","4":"C","5":"A","6":"B","7":"A","8":"D","9":"C","10":"B","11":"C","12":"B","13":"C","14":"B","15":"A","16":"A","17":"B","18":"C","19":"A","20":"D","21":"C","22":"B","23":"D","24":"C","25":"A"};
    LISTENING_ANSWER_OVERRIDES['2025_06_1'] = {"1":"C","2":"B","3":"D","4":"A","5":"A","6":"D","7":"C","8":"D","9":"C","10":"B","11":"A","12":"C","13":"C","14":"B","15":"B","16":"D","17":"A","18":"B","19":"B","20":"C","21":"B","22":"D","23":"A","24":"D","25":"A"};
    LISTENING_ANSWER_OVERRIDES['2025_06_2'] = {"1":"B","2":"A","3":"C","4":"D","5":"A","6":"B","7":"D","8":"C","9":"B","10":"C","11":"A","12":"C","13":"A","14":"B","15":"D","16":"C","17":"B","18":"D","19":"C","20":"D","21":"C","22":"C","23":"D","24":"B","25":"C"};
    LISTENING_ANSWER_OVERRIDES['2025_12_1'] = {"1":"D","2":"D","3":"B","4":"C","5":"A","6":"B","7":"D","8":"C","9":"D","10":"A","11":"C","12":"B","13":"B","14":"C","15":"D","16":"B","17":"A","18":"D","19":"C","20":"B","21":"D","22":"C","23":"A","24":"C","25":"D"};
    LISTENING_ANSWER_OVERRIDES['2025_12_2'] = {"1":"B","2":"A","3":"C","4":"D","5":"A","6":"B","7":"D","8":"C","9":"B","10":"C","11":"A","12":"C","13":"A","14":"B","15":"D","16":"C","17":"B","18":"D","19":"B","20":"B","21":"C","22":"B","23":"C","24":"C","25":"B"};

    // ===== Shared state =====
    const dataStatus = { loaded: false, loading: false, error: null, vocabCount: 0, readingCount: 0, listeningCount: 0, readingMatchedCount: 0, readingSkippedCount: 0, listeningSanitizedCount: 0, listeningMp3RestoredCount: 0, listeningOverriddenCount: 0 };
    let loadingPromise = null;
    const vocab = Object.create(null);
    const vocabList = [];
    const readings = [];
    const answers = Object.create(null);
    const listenings = Object.create(null);
    const U = {
      vocab: Object.create(null),
      mastered: Object.create(null),
      doneReadings: Object.create(null),
      doneListening: Object.create(null),
      reminder: null
    };

    // ===== Pure helpers =====
    function nowSec() { return Math.floor(Date.now() / 1000); }

    // ===== Data normalization (with upstream fixes) =====
    // Map old-style Section C labels to canonical names so they match answers.json keys.
    function normalizeReadingType(type) {
      if (!type) return type;
      if (type === 'Section C - Passage 1') return 'Section C1';
      if (type === 'Section C - Passage 2') return 'Section C2';
      return type;
    }
    // Extract month / set_index from filename when meta values are "未知" or default.
    // Filename examples:
    //   "2020年07月六级真题（全1套）.docx"
    //   "2020年09月六级真题（第1套）.docx"
    //   "2023年03月六级真题（第1套）.docx"
    function patchMetaFromFilename(m) {
      if (!m || !m.filename) return m;
      const fname = m.filename;
      // Month: prefer 年X月
      if (!m.month || String(m.month) === '未知' || m.month === 'x') {
        const mm = fname.match(/(\d{4})年(\d{1,2})月/);
        if (mm) m.month = mm[2];
      }
      // Set index: 第N套, or 全N套
      if (m.set_index === '1' || !m.set_index || m.set_index === 'x') {
        const ms = fname.match(/第(\d+)套/);
        if (ms) m.set_index = ms[1];
        else {
          const ms2 = fname.match(/全(\d+)套/);
          if (ms2) m.set_index = ms2[1];
        }
      }
      return m;
    }
    function normReading(item) {
      const content = item.content || '';
      const numRegex = /\b(\d{1,2})\b(?=\s)/g;
      const numbers = [...new Set([...content.matchAll(numRegex)].map(m => parseInt(m[1])).filter(n => 20 < n && n < 70))];
      numbers.sort((a, b) => a - b);
      const optRegex = /^([A-O])[\.\)、]\s*(.+)$/gm;
      const opts = {};
      let m;
      while ((m = optRegex.exec(content)) !== null) opts[m[1]] = m[2].trim();
      const optStart = content.search(/^A[\.\)、]/m);
      const passage = optStart > 0 ? content.slice(0, optStart).trim() : content;
      let m2 = item.meta || {};
      m2 = patchMetaFromFilename(m2);
      const type = normalizeReadingType(item.type);
      const id = (m2.year || 'x') + '_' + (m2.month || 'x') + '_' + (m2.set_index || m2.set || 'x') + '_' + (type || 'x').replace(/\s+/g, '_');
      return { id, meta: m2, type, passage, questionNumbers: numbers, options: opts };
    }

    // Sanitize a listening answer map: keep only single A/B/C/D letters, drop everything else.
    function sanitizeListeningAnswers(raw) {
      const out = {};
      if (!raw || typeof raw !== 'object') return out;
      for (const qn of Object.keys(raw)) {
        const v = String(raw[qn]).toUpperCase().trim().charAt(0);
        if (v === 'A' || v === 'B' || v === 'C' || v === 'D') out[qn] = v;
      }
      return out;
    }
    // Compute the true question count from sections (more reliable than meta.total).
    function countListeningQuestions(info) {
      const secs = info && info.sections;
      if (!secs) return 0;
      let n = 0;
      for (const sk of Object.keys(secs)) {
        const qs = secs[sk] && secs[sk].questions;
        if (Array.isArray(qs)) n += qs.length;
      }
      return n;
    }
    function normListening(info, key) {
      // Detect & repair old-shape entries: no meta, answers inlined as top-level numeric keys.
      let m = info.meta || null;
      if (!m) {
        const answers = {};
        for (const k of Object.keys(info)) {
          if (/^\d{1,2}$/.test(k)) answers[k] = info[k];
        }
        const parts = (key || '').split('_');
        m = {
          year: parts[0] || '?',
          month: parts[1] || '?',
          set_num: parts[2] || '?',
          mp3_file: null,
          has_mp3: false
        };
        info = Object.assign({}, info, { meta: m, answers: answers });
      }
      // Back-fill missing mp3_file from KNOWN_MP3S (e.g. 2023_03_1, 2022_06_1).
      let mp3Restored = false;
      if (!m.mp3_file && KNOWN_MP3S.has(key)) {
        m.mp3_file = 'cet6_' + key + '.mp3';
        m.has_mp3 = true;
        mp3Restored = true;
      }
      // Sanitize upstream answers (drop garbage letters like E/F/G/...)
      const cleanAnswers = sanitizeListeningAnswers(info.answers);
      // Recompute total from sections (more accurate than meta.total).
      const computedTotal = countListeningQuestions(info);
      const total = computedTotal > 0 ? computedTotal : (info.total || 0);
      // Apply authoritative overrides from Drhm1224 (highest priority).
      const override = LISTENING_ANSWER_OVERRIDES[key];
      let finalAnswers = cleanAnswers;
      let overridden = 0;
      if (override) {
        finalAnswers = Object.assign({}, cleanAnswers);
        for (const qn of Object.keys(override)) {
          const before = finalAnswers[qn];
          const after = override[qn];
          if (before !== after) overridden++;
          finalAnswers[qn] = after;
        }
      }
      const mp3 = m && m.mp3_file;
      return {
        key, meta: m, answers: finalAnswers, total,
        sections: info.sections,
        audioUrl: mp3 ? (DATA_REPO + '/CET-6%E5%90%AC%E5%8A%9B/' + mp3) : null,
        _sanitized: cleanAnswers.length !== Object.keys(info.answers || {}).length,
        _mp3Restored: mp3Restored,
        _overridden: overridden
      };
    }

    function getStats() {
      const today = new Date();
      const year = today.getFullYear();
      let exam;
      const june = new Date(year, 5, 13);
      const dec = new Date(year, 11, 13);
      if (today > dec) exam = new Date(year + 1, 5, 13);
      else if (today > june) exam = dec;
      else exam = june;
      const daysToExam = Math.ceil((exam - today) / (24 * 3600 * 1000));
      return {
        vocabTotal: vocabList.length,
        vocabReviewing: Object.keys(U.vocab).length,
        vocabMastered: Object.keys(U.mastered).length,
        dueNow: vocabReview(20).length,
        readings: {
          total: readings.length,
          done: Object.keys(U.doneReadings).length,
          remaining: readings.length - Object.keys(U.doneReadings).length
        },
        listenings: {
          total: Object.keys(listenings).length,
          done: Object.keys(U.doneListening).length,
          remaining: Object.keys(listenings).length - Object.keys(U.doneListening).length
        },
        nextExam: exam.toISOString().slice(0, 10),
        daysToExam,
        dataStatus,
        reminder: U.reminder
      };
    }

    // ===== Vocab engine =====
    function vocabLookup(word) {
      if (!word) return null;
      const w = String(word).toLowerCase().trim();
      return vocab[w] || null;
    }
    function vocabAdd(word) {
      if (!word) return { ok: false, msg: '请提供单词' };
      const w = String(word).toLowerCase().trim();
      if (!vocab[w]) return { ok: false, msg: '词库中没有此单词：' + word };
      if (U.vocab[w]) return { ok: false, msg: '已经在复习中：' + w };
      if (U.mastered[w]) return { ok: false, msg: '已掌握：' + w };
      const t = nowSec();
      U.vocab[w] = { stage: 0, addTime: t, nextReview: t + EBBING[0] };
      saveUserState();
      return { ok: true, word: w, meaning: vocab[w], stage: RANKS[0], nextReview: U.vocab[w].nextReview };
    }
    function vocabGrade(word, known) {
      const lw = word.toLowerCase().trim();
      if (!U.vocab[lw]) return { ok: false, msg: '不在复习列表：' + word };
      const t = nowSec();
      const cur = U.vocab[lw].stage;
      if (known) {
        if (cur + 1 >= EBBING.length) {
          U.mastered[lw] = { graduatedTime: t, meaning: vocab[lw] || '', rank: RANKS[RANKS.length - 1] };
          delete U.vocab[lw];
          saveUserState();
          return { ok: true, graduated: true, word: lw, rank: RANKS[RANKS.length - 1] };
        } else {
          const ns = cur + 1;
          U.vocab[lw].stage = ns;
          U.vocab[lw].nextReview = t + EBBING[ns];
          saveUserState();
          return { ok: true, graduated: false, word: lw, stage: RANKS[ns], nextReview: U.vocab[lw].nextReview };
        }
      } else {
        const ns = Math.max(0, cur - 2);
        U.vocab[lw].stage = ns;
        U.vocab[lw].nextReview = t + EBBING[ns];
        saveUserState();
        return { ok: true, graduated: false, word: lw, stage: RANKS[ns], nextReview: U.vocab[lw].nextReview, demoted: true };
      }
    }
    function vocabForget(word) {
      const lw = word.toLowerCase().trim();
      if (!U.vocab[lw]) return { ok: false, msg: '不在复习列表：' + word };
      const t = nowSec();
      const cur = U.vocab[lw].stage;
      const ns = Math.max(0, cur - 2);
      U.vocab[lw].stage = ns;
      U.vocab[lw].nextReview = t + EBBING[ns];
      saveUserState();
      return { ok: true, word: lw, stage: RANKS[ns], nextReview: U.vocab[lw].nextReview };
    }
    function vocabKill(word) {
      const lw = word.toLowerCase().trim();
      const t = nowSec();
      U.mastered[lw] = { graduatedTime: t, meaning: vocab[lw] || '释义丢失', rank: RANKS[RANKS.length - 1] };
      delete U.vocab[lw];
      saveUserState();
      return { ok: true, word: lw, rank: RANKS[RANKS.length - 1] };
    }
    function vocabRemove(word) {
      const lw = word.toLowerCase().trim();
      let from = null;
      if (U.vocab[lw]) { delete U.vocab[lw]; from = 'review'; }
      if (U.mastered[lw]) { delete U.mastered[lw]; from = from || 'mastered'; }
      if (from) saveUserState();
      return from ? { ok: true, from } : { ok: false };
    }
    function vocabReview(limit) {
      const t = nowSec();
      const due = [];
      const words = Object.keys(U.vocab);
      // Sort by overdue amount (most overdue first)
      words.sort((a, b) => U.vocab[a].nextReview - U.vocab[b].nextReview);
      for (const word of words) {
        if (U.vocab[word].nextReview <= t) {
          due.push({ word, stage: U.vocab[word].stage, meaning: vocab[word] || '' });
          if (due.length >= limit) break;
        }
      }
      return due;
    }
    function vocabNew(count) {
      const t = nowSec();
      const picked = [];
      const seen = new Set();
      while (picked.length < count && seen.size < vocabList.length) {
        const idx = Math.floor(Math.random() * vocabList.length);
        const w = vocabList[idx];
        seen.add(idx);
        if (U.vocab[w] || U.mastered[w]) continue;
        U.vocab[w] = { stage: 0, addTime: t, nextReview: t + EBBING[0] };
        picked.push({ word: w, meaning: vocab[w] });
      }
      if (picked.length) saveUserState();
      return picked;
    }
    function vocabGetList(mode) {
      if (mode === 'reviewing') {
        return Object.keys(U.vocab).map(w => ({ word: w, ...U.vocab[w], meaning: vocab[w] || '', rank: RANKS[U.vocab[w].stage] }));
      }
      if (mode === 'mastered') {
        return Object.keys(U.mastered).map(w => ({ word: w, ...U.mastered[w] }));
      }
      return {
        reviewing: Object.keys(U.vocab).map(w => ({ word: w, ...U.vocab[w], meaning: vocab[w] || '', rank: RANKS[U.vocab[w].stage] })),
        mastered: Object.keys(U.mastered).map(w => ({ word: w, ...U.mastered[w] }))
      };
    }

    // ===== Reading engine =====
    function readingDraw() {
      const undone = readings.filter(r => !U.doneReadings[r.id]);
      if (!undone.length) return { ok: false, msg: '已做完所有阅读真题！🎉' };
      const r = undone[Math.floor(Math.random() * undone.length)];
      return {
        ok: true, id: r.id, meta: r.meta, type: r.type,
        passage: r.passage, questionNumbers: r.questionNumbers,
        options: r.options, hasAnswer: !!answers[r.id]
      };
    }
    function readingGrade(qId, userAnswer) {
      const correct = answers[qId];
      if (!correct) return { ok: false, msg: '找不到答案：' + qId };
      const ua = String(userAnswer || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (ua.length !== correct.length) {
        return { ok: false, msg: '答案数量不匹配（需要 ' + correct.length + ' 个，实际 ' + ua.length + ' 个）', correct };
      }
      let right = 0;
      const detail = [];
      for (let i = 0; i < correct.length; i++) {
        const c = correct[i];
        const u = ua[i];
        const hit = c === u;
        if (hit) right++;
        detail.push({ q: i + 1, user: u, correct: c, ok: hit });
      }
      U.doneReadings[qId] = nowSec();
      saveUserState();
      return {
        ok: true, qId, right, total: correct.length,
        score: Math.round((right / correct.length) * 100),
        correct, user: ua, detail
      };
    }
    function readingCheck(qId) {
      const correct = answers[qId];
      if (!correct) return { ok: false, msg: '找不到答案：' + qId };
      U.doneReadings[qId] = nowSec();
      saveUserState();
      return { ok: true, qId, correct };
    }

    // ===== Listening engine =====
    function listeningDraw() {
      const keys = Object.keys(listenings).filter(k => !U.doneListening[k]);
      if (!keys.length) return { ok: false, msg: '已做完所有听力真题！🎉' };
      const k = keys[Math.floor(Math.random() * keys.length)];
      const l = listenings[k];
      return { ok: true, key: k, meta: l.meta, total: l.total, sections: l.sections, audioUrl: l.audioUrl, hasAnswers: !!l.answers };
    }
    function listeningGrade(key, userAnswer) {
      const l = listenings[key];
      if (!l) return { ok: false, msg: '找不到听力：' + key };
      const ua = String(userAnswer || '').toUpperCase().replace(/[^A-Z]/g, '');
      const correct = l.answers;
      let right = 0, total = 0;
      const detail = [];
      for (const qNum of Object.keys(correct)) {
        total++;
        const c = correct[qNum];
        const idx = parseInt(qNum) - 1;
        const u = idx < ua.length ? ua[idx] : '';
        const hit = c === u;
        if (hit) right++;
        detail.push({ q: parseInt(qNum), user: u, correct: c, ok: hit });
      }
      U.doneListening[key] = nowSec();
      saveUserState();
      return { ok: true, key, right, total, score: Math.round((right / total) * 100), detail };
    }
    function listeningSkip(key) {
      U.doneListening[key] = nowSec();
      saveUserState();
      return { ok: true, key };
    }

    // ===== Reminder =====
    function setReminder(hour, minute) {
      U.reminder = { hour: Number(hour), minute: Number(minute), lastDate: null };
      saveUserState();
      return { ok: true, hour: U.reminder.hour, minute: U.reminder.minute };
    }

    // ===== Persistence =====
    async function saveUserState() {
      if (!ctx.fs) return;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_user.json');
        await ctx.fs.writeText(target, JSON.stringify(U));
      } catch (e) { console.error('[cet6] save user state:', e); }
    }
    async function loadUserState() {
      if (!ctx.fs) return;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_user.json');
        const info = await ctx.fs.stat(target);
        if (!info) return;
        const text = await ctx.fs.readText(target);
        const obj = JSON.parse(text);
        if (obj.vocab) Object.assign(U.vocab, obj.vocab);
        if (obj.mastered) Object.assign(U.mastered, obj.mastered);
        if (obj.doneReadings) Object.assign(U.doneReadings, obj.doneReadings);
        if (obj.doneListening) Object.assign(U.doneListening, obj.doneListening);
        if (obj.reminder) U.reminder = obj.reminder;
      } catch (e) {}
    }
    async function saveDataCache() {
      if (!ctx.fs) return;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_cache.json');
        await ctx.fs.writeText(target, JSON.stringify({
          vocab, vocabList,
          readings, answers, listenings
        }));
      } catch (e) {}
    }
    async function loadDataCache() {
      if (!ctx.fs) return false;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_cache.json');
        const info = await ctx.fs.stat(target);
        if (!info) return false;
        const text = await ctx.fs.readText(target);
        const obj = JSON.parse(text);
        if (obj.vocab && obj.vocabList) {
          Object.assign(vocab, obj.vocab);
          vocabList.push(...obj.vocabList);
          for (const r of (obj.readings || [])) readings.push(r);
          Object.assign(answers, obj.answers || {});
          Object.assign(listenings, obj.listenings || {});
          dataStatus.vocabCount = vocabList.length;
          dataStatus.readingCount = readings.length;
          dataStatus.listeningCount = Object.keys(listenings).length;
          dataStatus.loaded = true;
          return true;
        }
      } catch (e) {}
      return false;
    }

    // ===== Data loading =====
    async function fetchJSON(url) {
      // ctx.web.fetch silently truncates large responses (~100KB cap), which breaks
      // JSON parsing for the 3 MB vocab/reading files. Strategy:
      //   1. Try web.fetch (fast, fine for small files like answers/listening).
      //   2. If body is truncated or kind != text/html, fall back to ctx.shell + curl,
      //      capturing stdout (no temp file → no fs / shell filesystem mismatch).
      try {
        const r = await ctx.web.fetch({ url });
        if (r.statusCode === 200 && !r.truncated && (r.body.kind === 'text' || r.body.kind === 'html')) {
          const text = r.body.content;
          if (text && text.length > 1024) return JSON.parse(text);
        }
      } catch (e) { /* fall through to shell */ }
      // Fallback: curl via shell (capture stdout)
      if (!ctx.shell) throw new Error('web.fetch truncated and shell unavailable');
      const sh = ctx.shell;
      // shell.exec.request.command must be ONE string; stdoutMaxBytes raised to fit ~3MB JSON;
      // sandboxPolicy must be danger-full-access for network access.
      const safeUrl = url.replace(/'/g, "'\\''");
      const spec = sh.resolve({
        command: "curl -fsSL --max-time 60 '" + safeUrl + "'",
        timeoutMs: 90000,
        stdoutMaxBytes: 8 * 1024 * 1024,
        sandboxPolicy: { mode: 'danger-full-access', workspaceRoot: '/' }
      });
      const res = await sh.run(spec);
      // stdout/stderr are CollectedOutput {text, truncated, spillPath} — use .text
      const stderrTxt = (res.stderr && res.stderr.text) || '';
      const stdoutTxt = (res.stdout && res.stdout.text) || '';
      if (res.exitCode !== 0) throw new Error('curl failed (exit ' + res.exitCode + '): ' + stderrTxt.slice(0, 500));
      if (!stdoutTxt || stdoutTxt.length < 10) throw new Error('curl produced no output (truncated=' + (res.stdout && res.stdout.truncated) + ')');
      return JSON.parse(stdoutTxt);
    }
    async function loadAllData() {
      if (dataStatus.loaded) return;
      if (dataStatus.loading) return loadingPromise;
      dataStatus.loading = true;
      loadingPromise = (async () => {
        try {
          console.log('[cet6] Loading data from GitHub...');
          const [vocabArr, rawReading, answerRaw, listeningRaw] = await Promise.all([
            fetchJSON(DATA_REPO + '/4-CET6-%E9%A1%BA%E5%BA%8F.json'),
            fetchJSON(DATA_REPO + '/CET6_Perfect_Verified.json'),
            fetchJSON(DATA_REPO + '/CET6_Answer.json'),
            fetchJSON(DATA_REPO + '/listening_questions_v3.json')
          ]);
          // Process vocab
          for (const item of vocabArr) {
            if (item.word) {
              const w = String(item.word).toLowerCase().trim();
              const trans = (item.translations || []).map(t => {
                const tt = (t.translation || '').trim();
                return t.type ? (t.type + '. ' + tt) : tt;
              }).filter(Boolean);
              if (trans.length && !vocab[w]) {
                vocab[w] = trans.join('；');
                vocabList.push(w);
              }
            }
          }
          // Process reading + answers
          // Strategy: a reading is only loaded if (a) its answer set exists in
          // answerRaw AND (b) the specific section answer string is non-empty
          // after stripping non-A-Z. Readings without available answers are
          // dropped entirely (no "暂无答案" ghost rows).
          let readingMatchedCount = 0, readingSkippedCount = 0;
          for (const item of rawReading) {
            const r = normReading(item);
            const m2 = r.meta || {}; // already patched in normReading
            const monthPad = String(m2.month || '').padStart(2, '0');
            const setKey = m2.year + '_' + monthPad + '_' + m2.set_index;
            const ans = answerRaw[setKey];
            if (!ans || !ans.answers) { readingSkippedCount++; continue; }
            // Use normalized r.type so 'Section C - Passage 1' → 'Section C1' matches answers.json
            const secAns = ans.answers[r.type] || '';
            const cleaned = secAns.replace(/[^A-Z]/g, '');
            if (!cleaned) { readingSkippedCount++; continue; }
            answers[r.id] = cleaned;
            readings.push(r);
            readingMatchedCount++;
          }
          // Process listening
          let listeningSanitizedCount = 0, listeningMp3RestoredCount = 0, listeningOverriddenCount = 0;
          for (const k of Object.keys(listeningRaw)) {
            const normed = normListening(listeningRaw[k], k);
            listenings[k] = normed;
            if (normed._sanitized) listeningSanitizedCount++;
            if (normed._mp3Restored) listeningMp3RestoredCount++;
            if (normed._overridden) listeningOverriddenCount++;
          }
          dataStatus.vocabCount = vocabList.length;
          dataStatus.readingCount = readings.length;
          dataStatus.listeningCount = Object.keys(listenings).length;
          dataStatus.readingMatchedCount = readingMatchedCount;
          dataStatus.readingSkippedCount = readingSkippedCount;
          dataStatus.listeningSanitizedCount = listeningSanitizedCount;
          dataStatus.listeningMp3RestoredCount = listeningMp3RestoredCount;
          dataStatus.listeningOverriddenCount = listeningOverriddenCount;
          dataStatus.loaded = true;
          console.log('[cet6] Data ready: ' + dataStatus.vocabCount + ' words, ' + dataStatus.readingCount + ' readings (' + readingMatchedCount + ' loaded, ' + readingSkippedCount + ' skipped for missing answers), ' + dataStatus.listeningCount + ' listenings (' + listeningSanitizedCount + ' sanitized, ' + listeningMp3RestoredCount + ' mp3-restored, ' + listeningOverriddenCount + ' overridden)');
          try { await saveDataCache(); } catch (e) { console.error('[cet6] cache save:', e); }
        } catch (e) {
          dataStatus.error = String(e && e.message || e);
          console.error('[cet6] data load failed:', e);
        } finally {
          dataStatus.loading = false;
        }
      })();
      return loadingPromise;
    }

    // ===== RPC handlers =====
    const rpcDisposers = [];
    function rpc(method, handler) {
      const dispose = harness.handle(method, handler);
      rpcDisposers.push(dispose);
      return dispose;
    }
    rpc('cet6/state', async () => getStats());
    rpc('cet6/data-status', async () => dataStatus);
    rpc('cet6/reload-data', async () => { dataStatus.loaded = false; dataStatus.vocabCount = 0; readings.length = 0; Object.keys(vocab).forEach(k => delete vocab[k]); vocabList.length = 0; Object.keys(answers).forEach(k => delete answers[k]); Object.keys(listenings).forEach(k => delete listenings[k]); await loadAllData(); return dataStatus; });
    rpc('cet6/vocab/lookup', async (args) => {
      const m = vocabLookup(args.word);
      return m ? { ok: true, word: String(args.word).toLowerCase(), meaning: m } : { ok: false, msg: '词库中无此单词' };
    });
    rpc('cet6/vocab/add', async (args) => vocabAdd(args.word));
    rpc('cet6/vocab/grade', async (args) => vocabGrade(args.word, !!args.known));
    rpc('cet6/vocab/forget', async (args) => vocabForget(args.word));
    rpc('cet6/vocab/kill', async (args) => vocabKill(args.word));
    rpc('cet6/vocab/remove', async (args) => vocabRemove(args.word));
    rpc('cet6/vocab/review', async (args) => vocabReview(args.limit || 20));
    rpc('cet6/vocab/new', async (args) => vocabNew(args.count || 10));
    rpc('cet6/vocab/list', async (args) => vocabGetList(args.mode || 'all'));
    rpc('cet6/reading/draw', async () => readingDraw());
    rpc('cet6/reading/grade', async (args) => readingGrade(args.qId, args.userAnswer));
    rpc('cet6/reading/check', async (args) => readingCheck(args.qId));
    rpc('cet6/listening/draw', async () => listeningDraw());
    rpc('cet6/listening/grade', async (args) => listeningGrade(args.key, args.userAnswer));
    rpc('cet6/listening/skip', async (args) => listeningSkip(args.key));
    rpc('cet6/set-reminder', async (args) => setReminder(args.hour, args.minute));

    // Cleanup RPC disposers when plugin stops
    ctx.effect(() => () => { for (const d of rpcDisposers) try { d(); } catch (e) {} });

    // ===== Daily reminder timer =====
    ctx.timer.interval(() => {
      if (!U.reminder) return;
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      if (U.reminder.lastDate === today) return;
      if (now.getHours() === U.reminder.hour && now.getMinutes() === U.reminder.minute) {
        const due = vocabReview(50);
        if (due.length) {
          U.reminder.lastDate = today;
          saveUserState();
          console.log('[cet6] 🔔 复习提醒: ' + due.length + ' 个单词待复习');
        }
      }
    }, 60 * 1000);

    // ===== Dynamic Tools =====
    const tools = [
      {
        name: 'cet6_lookup',
        description: '查单词释义。查询一个 CET-6 词汇的中文释义、词性。仅支持词库内单词。',
        parameters: {
          type: 'object',
          properties: { word: { type: 'string', description: '要查询的英文单词' } },
          required: ['word']
        },
        execute: async (args) => {
          const m = vocabLookup(args.word);
          return m ? { ok: true, word: args.word, meaning: m } : { ok: false, msg: '词库未收录：' + args.word };
        }
      },
      {
        name: 'cet6_review',
        description: '获取用户今天需要复习的 CET-6 单词列表（艾宾浩斯到期）。',
        parameters: {
          type: 'object',
          properties: { limit: { type: 'number', description: '最多返回多少个（默认 20）' } }
        },
        execute: async (args) => {
          const due = vocabReview(args.limit || 20);
          return { count: due.length, items: due };
        }
      },
      {
        name: 'cet6_stats',
        description: '查看当前用户的单词、阅读、听力进度以及距离下次 CET-6 考试的倒计时。',
        parameters: { type: 'object', properties: {} },
        execute: async () => getStats()
      }
    ];
    for (const t of tools) {
      try {
        const defined = harness.defineTool(t);
        const dispose = harness.registerTool(ctx, defined);
        ctx.effect(() => dispose);
      } catch (e) { console.error('[cet6] tool register failed:', e); }
    }

    // ===== Boot =====
    (async () => {
      await loadUserState();
      const cached = await loadDataCache();
      if (cached) {
        console.log('[cet6] Loaded from cache');
      } else {
        await loadAllData();
      }
    })();

    console.log('[cet6] Host plugin ready');
  }
};