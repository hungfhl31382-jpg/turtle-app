// MẪU DỮ LIỆU BAN ĐẦU (Khởi tạo nếu localStorage rỗng)
        const defaultStudySets = [
            {
                id: "set_ielts_core",
                title: "IELTS Core Vocabulary",
                category: "Tiếng Anh",
                description: "Tổng hợp các từ vựng band 7.0+ nâng cao cần thiết cho phần thi Reading và Writing.",
                progress: 65,
                cards: [
                    { id: "c1", term: "Meticulous", definition: "Tỉ mỉ, kỹ càng, trau chuốt từng chi tiết nhỏ.", interval: 4, easeFactor: 2.5, nextReview: Date.now() },
                    { id: "c2", term: "Ameliorate", definition: "Làm tốt hơn, cải thiện tình trạng của một vấn đề.", interval: 1, easeFactor: 2.3, nextReview: Date.now() },
                    { id: "c3", term: "Pragmatic", definition: "Thực tế, thực dụng, dựa trên trải nghiệm thực tiễn thay vì lý thuyết.", interval: 7, easeFactor: 2.6, nextReview: Date.now() + 86400000 },
                    { id: "c4", term: "Ephemeral", definition: "Phù du, chóng vánh, chỉ kéo dài trong một khoảng thời gian rất ngắn.", interval: 2, easeFactor: 2.4, nextReview: Date.now() }
                ]
            },
            {
                id: "set_hoa_12",
                title: "Lipid & Chất Béo bồi dưỡng",
                category: "Khoa Học",
                description: "Học phần hóa học hữu cơ lớp 12A3 nâng cao phục vụ kỳ thi HSA.",
                progress: 25,
                cards: [
                    { id: "c5", term: "Triolein", definition: "Chất béo lỏng, công thức cấu tạo (C17H33COO)3C3H5.", interval: 1, easeFactor: 2.1, nextReview: Date.now() },
                    { id: "c6", term: "Phản ứng xà phòng hóa", definition: "Thủy phân chất béo trong môi trường kiềm tạo ra muối của axit béo và glixerol.", interval: 3, easeFactor: 2.4, nextReview: Date.now() + 172800000 }
                ]
            }
        ];

        // ================= SUPABASE: ĐĂNG NHẬP + ĐỒNG BỘ DỮ LIỆU ĐA THIẾT BỊ =================
        // Cần tạo 1 project miễn phí tại https://supabase.com rồi điền URL + anon key vào đây.
        // Xem hướng dẫn đầy đủ trong README.md (mục "Thiết lập đăng nhập & đồng bộ dữ liệu").
        const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
        const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
        const supabaseClient = (typeof window.supabase !== 'undefined' && !SUPABASE_URL.includes('YOUR-PROJECT'))
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
            : null;

        let currentUser = null;
        let cloudSyncTimer = null;
        let authMode = 'signin'; // 'signin' | 'signup'

        function isCloudConfigured() { return !!supabaseClient; }

        // ---------- MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ ----------
        function renderAuthScreen(errorMsg) {
            const el = document.getElementById('auth-screen');
            if (!el) return;
            const isSignup = authMode === 'signup';
            el.innerHTML = `
            <div class="w-full max-w-sm space-y-4">
                <div class="text-center space-y-2">
                    <div class="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mx-auto">
                        <i data-lucide="turtle" class="w-6 h-6"></i>
                    </div>
                    <h1 class="text-xl font-bold">Turtle</h1>
                    <p class="text-sm text-slate-400">${isSignup ? 'Tạo tài khoản để đồng bộ dữ liệu học tập' : 'Đăng nhập để tiếp tục học'}</p>
                </div>

                ${!isCloudConfigured() ? `
                <div class="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs rounded-xl p-3 leading-relaxed">
                    Chưa cấu hình Supabase nên chưa thể đăng nhập/đồng bộ. Xem hướng dẫn trong README.md để bật tính năng này. Trong lúc chờ, bạn vẫn có thể dùng thử app ở chế độ offline.
                    <button onclick="initApp(true)" class="block mt-2 font-semibold underline">Dùng thử offline →</button>
                </div>` : ''}

                ${errorMsg ? `<div class="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl p-3">${escapeHtml(errorMsg)}</div>` : ''}

                <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/50 shadow-sm p-6 space-y-4">
                    <button onclick="signInGoogle()" ${!isCloudConfigured() ? 'disabled' : ''} class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.4-4.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"/><path fill="#4CAF50" d="M24 45.5c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 36.6 26.9 37.5 24 37.5c-5.4 0-9.9-3.4-11.5-8.2l-6.6 5.1C9.6 40.9 16.2 45.5 24 45.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-1.9 3.8-3.5 5.1l6.6 5.4C42 34.9 44.5 30.3 44.5 25c0-1.5-.2-3-.4-4.5z"/></svg>
                        Đăng nhập bằng Google
                    </button>

                    <div class="flex items-center gap-3 text-xs text-slate-400"><div class="flex-1 h-px bg-slate-100 dark:bg-zinc-800"></div>hoặc<div class="flex-1 h-px bg-slate-100 dark:bg-zinc-800"></div></div>

                    <div class="space-y-2">
                        <input id="auth-email" type="email" placeholder="Email" class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/30">
                        <input id="auth-password" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" onkeydown="if(event.key==='Enter') submitAuthForm();" class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/30">
                    </div>

                    <button onclick="submitAuthForm()" id="auth-submit-btn" ${!isCloudConfigured() ? 'disabled' : ''} class="w-full py-2.5 rounded-xl font-semibold text-sm bg-brand-500 hover:bg-brand-600 text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">${isSignup ? 'Đăng ký' : 'Đăng nhập'}</button>

                    <p class="text-center text-xs text-slate-400">
                        ${isSignup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                        <button onclick="authMode = '${isSignup ? 'signin' : 'signup'}'; renderAuthScreen();" class="text-brand-500 font-semibold hover:underline">${isSignup ? 'Đăng nhập' : 'Đăng ký ngay'}</button>
                    </p>
                </div>
            </div>`;
            safeLucide();
        }

        async function submitAuthForm() {
            if (!isCloudConfigured()) { renderAuthScreen('Chưa cấu hình Supabase.'); return; }
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-password').value;
            if (!email || !password) { renderAuthScreen('Nhập đầy đủ email và mật khẩu nhé.'); return; }
            const btn = document.getElementById('auth-submit-btn');
            if (btn) { btn.disabled = true; btn.textContent = 'Đang xử lý...'; }
            try {
                if (authMode === 'signup') {
                    const { data, error } = await supabaseClient.auth.signUp({ email, password });
                    if (error) throw error;
                    if (data.user && !data.session) {
                        renderAuthScreen('Đã gửi email xác nhận. Kiểm tra hộp thư để hoàn tất đăng ký nhé!');
                        return;
                    }
                } else {
                    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                }
                // onAuthStateChange (đăng ký ở initAuth) sẽ tự lo phần vào app + tải dữ liệu
            } catch (err) {
                renderAuthScreen(translateAuthError(err.message));
            }
        }

        async function signInGoogle() {
            if (!isCloudConfigured()) { renderAuthScreen('Chưa cấu hình Supabase.'); return; }
            await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
        }

        async function signOutUser() {
            if (isCloudConfigured()) { try { await supabaseClient.auth.signOut(); } catch (e) {} }
            currentUser = null;
            document.getElementById('app-root').classList.add('hidden');
            document.getElementById('auth-screen').classList.remove('hidden');
            authMode = 'signin';
            renderAuthScreen();
        }

        function translateAuthError(msg) {
            if (!msg) return 'Có lỗi xảy ra, thử lại nhé.';
            if (msg.includes('Invalid login credentials')) return 'Sai email hoặc mật khẩu.';
            if (msg.includes('User already registered')) return 'Email này đã được đăng ký, thử đăng nhập nhé.';
            if (msg.includes('Password should be at least')) return 'Mật khẩu cần ít nhất 6 ký tự.';
            return msg;
        }

        // ---------- ĐỒNG BỘ DỮ LIỆU LÊN/XUỐNG SUPABASE ----------
        // Gộp toàn bộ dữ liệu học tập (bộ thẻ + streak + lịch học) thành 1 JSON theo từng user.
        function collectAllAppData() {
            return { studySets, dailyActivity, calendarEvents };
        }

        function applyAllAppData(data) {
            if (!data) return;
            if (data.studySets) { studySets = data.studySets; localStorage.setItem('ruanho_sets', JSON.stringify(studySets)); }
            if (data.dailyActivity) { dailyActivity = data.dailyActivity; localStorage.setItem('ruanho_activity', JSON.stringify(dailyActivity)); }
            if (data.calendarEvents) { calendarEvents = data.calendarEvents; localStorage.setItem('ruanho_calendar_events', JSON.stringify(calendarEvents)); }
        }

        // Gộp nhiều thay đổi liên tiếp lại, chỉ đẩy lên cloud 1 lần sau 1.2s để tránh gọi API liên tục
        function queueCloudSync() {
            if (!isCloudConfigured() || !currentUser) return;
            clearTimeout(cloudSyncTimer);
            cloudSyncTimer = setTimeout(pushCloudData, 1200);
        }

        async function pushCloudData() {
            if (!isCloudConfigured() || !currentUser) return;
            try {
                await supabaseClient.from('app_data').upsert({
                    user_id: currentUser.id,
                    data: collectAllAppData(),
                    updated_at: new Date().toISOString()
                });
            } catch (e) { console.error('Lỗi đồng bộ lên cloud:', e); }
        }

        async function pullCloudData() {
            if (!isCloudConfigured() || !currentUser) return;
            try {
                const { data, error } = await supabaseClient.from('app_data').select('data').eq('user_id', currentUser.id).maybeSingle();
                if (error) throw error;
                if (data && data.data) {
                    applyAllAppData(data.data);
                } else {
                    // Lần đăng nhập đầu tiên, chưa có dữ liệu trên cloud -> đẩy dữ liệu local hiện có lên
                    await pushCloudData();
                }
            } catch (e) { console.error('Lỗi tải dữ liệu từ cloud:', e); }
        }

        // ---------- XỬ LÝ TRẠNG THÁI ĐĂNG NHẬP / VÀO APP ----------
        function applyThemeAndBoot() {
            const savedTheme = localStorage.getItem('ruanho_theme');
            if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            updateStreakDisplay();
            switchPage('dashboard');
            safeLucide();
        }

        async function enterApp(user) {
            currentUser = user;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-root').classList.remove('hidden');
            const emailEl = document.getElementById('account-email');
            if (emailEl) emailEl.textContent = user.email || 'Đã đăng nhập';
            await pullCloudData();
            applyThemeAndBoot();
        }

        // Cho vào app ở chế độ offline (chưa cấu hình Supabase, hoặc người dùng bấm "Dùng thử offline")
        function initApp(offline) {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-root').classList.remove('hidden');
            const emailEl = document.getElementById('account-email');
            if (emailEl) emailEl.textContent = offline ? 'Chế độ offline (chưa đăng nhập)' : '...';
            applyThemeAndBoot();
        }

        function initAuth() {
            if (!isCloudConfigured()) {
                initApp(true);
                return;
            }

            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session && session.user) {
                    if (!currentUser || currentUser.id !== session.user.id) enterApp(session.user);
                } else {
                    currentUser = null;
                    document.getElementById('app-root').classList.add('hidden');
                    document.getElementById('auth-screen').classList.remove('hidden');
                    renderAuthScreen();
                }
            });

            // Hiện màn đăng nhập trong lúc chờ Supabase kiểm tra phiên đăng nhập cũ (nếu có)
            renderAuthScreen();
        }

        let studySets = JSON.parse(localStorage.getItem('ruanho_sets')) || defaultStudySets;
        function saveToStorage() { localStorage.setItem('ruanho_sets', JSON.stringify(studySets)); queueCloudSync(); }

        // ================= HOẠT ĐỘNG HÀNG NGÀY THẬT (STREAK & BIỂU ĐỒ TUẦN) =================
        // Trước đây "streak-counter" và biểu đồ tuần bị hard-code cứng, không phản ánh
        // hoạt động học thật -> đây là lý do 2 khu vực đó "không hoạt động". Khối dưới đây
        // ghi nhận thật mỗi khi người dùng trả lời 1 thẻ ở bất kỳ chế độ học nào.
        let dailyActivity = JSON.parse(localStorage.getItem('ruanho_activity') || '{}');

        function dateKey(offsetDays = 0) {
            const d = new Date();
            d.setDate(d.getDate() - offsetDays);
            return d.toISOString().slice(0, 10);
        }

        function recordActivity(count = 1) {
            const key = dateKey(0);
            dailyActivity[key] = (dailyActivity[key] || 0) + count;
            localStorage.setItem('ruanho_activity', JSON.stringify(dailyActivity));
            queueCloudSync();
            updateStreakDisplay();
        }

        function computeStreak() {
            let streak = 0;
            for (let i = 0; i < 3650; i++) {
                if (dailyActivity[dateKey(i)] > 0) streak++;
                else break;
            }
            return streak;
        }

        function updateStreakDisplay() {
            const el = document.getElementById('streak-counter');
            if (el) el.innerText = `${computeStreak()} Ngày`;
        }

        // Trả về 7 ngày gần nhất (từ xa -> gần) kèm nhãn thứ và số thẻ đã ôn trong ngày đó
        function getLast7DaysActivity() {
            const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                days.push({ key, label: i === 0 ? 'Hôm nay' : labels[d.getDay()], count: dailyActivity[key] || 0 });
            }
            return days;
        }

        // ================= LỊCH HỌC KIỂU GOOGLE CALENDAR (SỰ KIỆN CÓ GIỜ) =================
        // Mỗi sự kiện: { id, title, date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', note, color }
        let calendarEvents = JSON.parse(localStorage.getItem('ruanho_calendar_events') || '[]');
        function saveCalendarEvents() { localStorage.setItem('ruanho_calendar_events', JSON.stringify(calendarEvents)); queueCloudSync(); }

        // Luôn chuẩn hóa về ngày-tháng-năm local (không dùng toISOString để tránh
        // lệch ngày do múi giờ khi người dùng bấm đúng vào 1 ô ngày/giờ trên lịch).
        function ymdKey(d) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        const CALENDAR_COLORS = {
            brand: { dot: 'bg-brand-500', chip: 'bg-brand-500/15 text-brand-700 dark:text-brand-400 border-l-brand-500', solid: 'bg-brand-500' },
            blue: { dot: 'bg-blue-500', chip: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-l-blue-500', solid: 'bg-blue-500' },
            purple: { dot: 'bg-purple-500', chip: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-l-purple-500', solid: 'bg-purple-500' },
            rose: { dot: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-l-rose-500', solid: 'bg-rose-500' },
            amber: { dot: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-l-amber-500', solid: 'bg-amber-500' },
        };

        // Ngày đang được xem/chọn làm mốc cho lịch (áp dụng cho cả 3 chế độ Tháng/Tuần/Ngày)
        let calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        let calendarViewMode = 'week'; // 'month' | 'week' | 'day'
        const CAL_PX_PER_HOUR = 52;

        function setCalendarView(mode) {
            calendarViewMode = mode;
            renderView('study-calendar');
            safeLucide();
        }

        function changeCalendarPeriod(delta) {
            const d = new Date(calendarViewDate);
            if (calendarViewMode === 'month') d.setMonth(d.getMonth() + delta);
            else if (calendarViewMode === 'week') d.setDate(d.getDate() + delta * 7);
            else d.setDate(d.getDate() + delta);
            calendarViewDate = d;
            renderView('study-calendar');
            safeLucide();
        }

        function goToToday() {
            calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
            renderView('study-calendar');
            safeLucide();
        }

        // Nhảy tới 1 ngày cụ thể (bấm từ mini lịch sidebar hoặc từ ô ngày trong tháng)
        function jumpToCalendarDate(key, mode) {
            calendarViewDate = new Date(key + 'T00:00:00');
            if (mode) calendarViewMode = mode;
            renderView('study-calendar');
            safeLucide();
        }

        function startOfWeek(d) {
            const r = new Date(d);
            r.setDate(r.getDate() - r.getDay()); // Chủ nhật đầu tuần
            return r;
        }

        function timeToMinutes(t) {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        }

        function getEventsForDate(key) {
            return calendarEvents.filter(e => e.date === key).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
        }

        // ============ MODAL TẠO/SỬA SỰ KIỆN HỌC ============
        function openEventModal(eventId, presetDate, presetHour) {
            const editing = eventId ? calendarEvents.find(e => e.id === eventId) : null;
            const today = ymdKey(new Date());
            const date = editing ? editing.date : (presetDate || today);
            const start = editing ? editing.start : (typeof presetHour === 'number' ? String(presetHour).padStart(2, '0') + ':00' : '08:00');
            const endDefaultHour = typeof presetHour === 'number' ? presetHour + 1 : 9;
            const end = editing ? editing.end : (String(Math.min(endDefaultHour, 23)).padStart(2, '0') + ':00');
            const title = editing ? editing.title : '';
            const note = editing ? (editing.note || '') : '';
            const color = editing ? editing.color : 'brand';

            const container = document.getElementById('modal-container');
            if (!container) return;

            const colorButtons = Object.keys(CALENDAR_COLORS).map(c => `
                <button type="button" onclick="selectEventColor('${c}')" data-color-btn="${c}" class="w-7 h-7 rounded-full ${CALENDAR_COLORS[c].solid} ${color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'} transition-all"></button>
            `).join('');

            container.innerHTML = `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm modal-backdrop" onclick="if(event.target === this) closeResultModal()">
                <div class="modal-panel bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <span class="text-xs font-semibold uppercase text-brand-500 tracking-wide">${editing ? 'Sửa lịch học' : 'Thêm lịch học'}</span>
                            <h3 class="text-lg font-bold leading-tight">${editing ? 'Cập nhật buổi học' : 'Đặt lịch một buổi học mới'}</h3>
                        </div>
                        <button onclick="closeResultModal()" class="p-2 shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>

                    <input type="hidden" id="event-color-input" value="${color}">
                    <input type="hidden" id="event-id-input" value="${editing ? editing.id : ''}">

                    <div class="space-y-2">
                        <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Học gì?</label>
                        <input id="event-title-input" type="text" value="${escapeHtml(title)}" placeholder="Ví dụ: Ôn từ vựng IELTS, Học chương 3 Hóa..." class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/30">
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <div class="space-y-2 col-span-1">
                            <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Ngày</label>
                            <input id="event-date-input" type="date" value="${date}" class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl px-2 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/30">
                        </div>
                        <div class="space-y-2 col-span-1">
                            <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Bắt đầu</label>
                            <input id="event-start-input" type="time" value="${start}" class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl px-2 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/30">
                        </div>
                        <div class="space-y-2 col-span-1">
                            <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Kết thúc</label>
                            <input id="event-end-input" type="time" value="${end}" class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl px-2 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/30">
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Ghi chú thêm</label>
                        <textarea id="event-note-input" rows="2" placeholder="Chi tiết nội dung sẽ học (không bắt buộc)..." class="w-full text-sm bg-slate-50 dark:bg-zinc-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-500/30 resize-none">${escapeHtml(note)}</textarea>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Màu</label>
                        <div class="flex items-center gap-2">${colorButtons}</div>
                    </div>

                    <div class="flex gap-2 pt-2">
                        ${editing ? `<button onclick="deleteEvent('${editing.id}')" class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                        <button onclick="closeResultModal()" class="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all active:scale-95">Hủy</button>
                        <button onclick="saveEvent()" class="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-brand-500 hover:bg-brand-600 text-white transition-all active:scale-95">${editing ? 'Cập nhật' : 'Thêm vào lịch'}</button>
                    </div>
                </div>
            </div>`;
            safeLucide();
        }

        function selectEventColor(c) {
            document.getElementById('event-color-input').value = c;
            document.querySelectorAll('[data-color-btn]').forEach(btn => {
                const isSel = btn.getAttribute('data-color-btn') === c;
                btn.className = `w-7 h-7 rounded-full ${CALENDAR_COLORS[btn.getAttribute('data-color-btn')].solid} ${isSel ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'} transition-all`;
            });
        }

        function saveEvent() {
            const id = document.getElementById('event-id-input').value;
            const title = document.getElementById('event-title-input').value.trim();
            const date = document.getElementById('event-date-input').value;
            let start = document.getElementById('event-start-input').value;
            let end = document.getElementById('event-end-input').value;
            const note = document.getElementById('event-note-input').value.trim();
            const color = document.getElementById('event-color-input').value;

            if (!title) { showToast('Nhập tên buổi học trước đã nhé!', 'alert-circle'); return; }
            if (!date || !start || !end) { showToast('Chọn đủ ngày, giờ bắt đầu và kết thúc nhé!', 'alert-circle'); return; }
            if (timeToMinutes(end) <= timeToMinutes(start)) { showToast('Giờ kết thúc phải sau giờ bắt đầu!', 'alert-circle'); return; }

            if (id) {
                const ev = calendarEvents.find(e => e.id === id);
                if (ev) Object.assign(ev, { title, date, start, end, note, color });
            } else {
                calendarEvents.push({ id: 'ev_' + Date.now() + Math.random().toString(36).slice(2, 6), title, date, start, end, note, color });
            }
            saveCalendarEvents();
            closeResultModal();
            showToast(id ? 'Đã cập nhật lịch học!' : 'Đã thêm vào lịch học!', 'calendar-check');
            calendarViewDate = new Date(date + 'T00:00:00');
            renderView('study-calendar');
            safeLucide();
        }

        function deleteEvent(id) {
            calendarEvents = calendarEvents.filter(e => e.id !== id);
            saveCalendarEvents();
            closeResultModal();
            showToast('Đã xóa buổi học khỏi lịch.', 'trash-2');
            renderView('study-calendar');
            safeLucide();
        }

        // ============ RENDER CÁC THÀNH PHẦN CON CỦA TRANG LỊCH ============

        // Mini lịch tháng nhỏ ở sidebar trái, giống Google Calendar
        function renderMiniCalendar() {
            const base = calendarViewDate;
            const year = base.getFullYear(), month = base.getMonth();
            const firstWeekday = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const todayKey = ymdKey(new Date());
            const selectedKey = ymdKey(base);
            const monthLabel = base.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

            let cells = '';
            for (let i = 0; i < firstWeekday; i++) cells += `<div></div>`;
            for (let day = 1; day <= daysInMonth; day++) {
                const key = ymdKey(new Date(year, month, day));
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                cells += `<button onclick="jumpToCalendarDate('${key}')" class="w-7 h-7 mx-auto flex items-center justify-center text-[11px] rounded-full transition-all ${isSelected ? 'bg-brand-500 text-white font-bold' : isToday ? 'text-brand-500 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}">${day}</button>`;
            }

            return `
            <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/50 p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold capitalize">${monthLabel}</span>
                    <div class="flex items-center gap-1">
                        <button onclick="event.stopPropagation(); calendarViewDate = new Date(${year}, ${month - 1}, 1); renderView('study-calendar'); safeLucide();" class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>
                        <button onclick="event.stopPropagation(); calendarViewDate = new Date(${year}, ${month + 1}, 1); renderView('study-calendar'); safeLucide();" class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800"><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>
                <div class="grid grid-cols-7 gap-y-1 text-center text-[10px] font-bold text-slate-400">
                    <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
                </div>
                <div class="grid grid-cols-7 gap-y-1">${cells}</div>
            </div>`;
        }

        // Chế độ xem THÁNG: lưới ngày, mỗi ô hiện tối đa 2 sự kiện + "+N khác"
        function renderMonthGrid() {
            const year = calendarViewDate.getFullYear(), month = calendarViewDate.getMonth();
            const firstWeekday = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const todayKey = ymdKey(new Date());

            let cells = '';
            for (let i = 0; i < firstWeekday; i++) cells += `<div class="border border-transparent"></div>`;
            for (let day = 1; day <= daysInMonth; day++) {
                const key = ymdKey(new Date(year, month, day));
                const isToday = key === todayKey;
                const events = getEventsForDate(key);
                const visible = events.slice(0, 2);
                const extra = events.length - visible.length;

                const chipsHtml = visible.map(e => `
                    <div onclick="event.stopPropagation(); openEventModal('${e.id}')" class="text-[10px] px-1.5 py-0.5 rounded-md border-l-2 ${CALENDAR_COLORS[e.color].chip} truncate cursor-pointer hover:opacity-80">
                        <span class="font-semibold">${e.start}</span> ${escapeHtml(e.title)}
                    </div>`).join('');

                cells += `
                <div onclick="openEventModal(null, '${key}')" class="h-24 sm:h-28 rounded-xl border border-slate-100 dark:border-zinc-800 p-1.5 flex flex-col gap-1 text-left cursor-pointer hover:border-brand-500/40 transition-all overflow-hidden bg-white dark:bg-zinc-900">
                    <span onclick="event.stopPropagation(); jumpToCalendarDate('${key}', 'day')" class="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${isToday ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}">${day}</span>
                    <div class="space-y-0.5 overflow-hidden">
                        ${chipsHtml}
                        ${extra > 0 ? `<div class="text-[10px] text-slate-400 pl-1.5">+${extra} khác</div>` : ''}
                    </div>
                </div>`;
            }

            return `
            <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/50 shadow-sm p-4 sm:p-6">
                <div class="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold text-slate-400 uppercase">
                    <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
                </div>
                <div class="grid grid-cols-7 gap-2">${cells}</div>
            </div>`;
        }

        // Chế độ xem TUẦN/NGÀY: lưới giờ trong ngày, sự kiện đặt vị trí tuyệt đối theo phút
        function renderTimeGrid(days) {
            const todayKey = ymdKey(new Date());
            const hourRows = Array.from({ length: 24 }, (_, h) => `
                <div class="relative border-t border-slate-100 dark:border-zinc-800" style="height:${CAL_PX_PER_HOUR}px">
                    <span class="absolute -top-2 right-1 text-[10px] text-slate-400 bg-white dark:bg-zinc-900 pl-1 whitespace-nowrap">${h === 0 ? '' : (h < 10 ? '0' + h : h) + ':00'}</span>
                </div>`).join('');

            const headerCols = days.map(key => {
                const d = new Date(key + 'T00:00:00');
                const isToday = key === todayKey;
                const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
                return `
                <div class="flex-1 text-center py-2 border-b border-slate-100 dark:border-zinc-800 cursor-pointer" onclick="jumpToCalendarDate('${key}', 'day')">
                    <div class="text-[11px] font-bold text-slate-400 uppercase">${wd}</div>
                    <div class="w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-brand-500 text-white' : 'text-slate-700 dark:text-zinc-200'}">${d.getDate()}</div>
                </div>`;
            }).join('');

            const dayCols = days.map(key => {
                const events = getEventsForDate(key);
                const slots = Array.from({ length: 24 }, (_, h) => `
                    <div onclick="openEventModal(null, '${key}', ${h})" class="border-t border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer" style="height:${CAL_PX_PER_HOUR}px"></div>`).join('');

                const eventsHtml = events.map(e => {
                    const top = (timeToMinutes(e.start) / 60) * CAL_PX_PER_HOUR;
                    const height = Math.max(20, ((timeToMinutes(e.end) - timeToMinutes(e.start)) / 60) * CAL_PX_PER_HOUR);
                    return `
                    <div onclick="event.stopPropagation(); openEventModal('${e.id}')" class="absolute left-0.5 right-0.5 rounded-lg border-l-4 ${CALENDAR_COLORS[e.color].chip} px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 shadow-sm" style="top:${top}px; height:${height}px;">
                        <div class="text-[11px] font-bold truncate">${escapeHtml(e.title)}</div>
                        <div class="text-[10px] opacity-80 truncate">${e.start} - ${e.end}</div>
                    </div>`;
                }).join('');

                return `<div class="relative flex-1 border-l border-slate-100 dark:border-zinc-800">${slots}${eventsHtml}</div>`;
            }).join('');

            return `
            <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div class="flex border-b border-slate-100 dark:border-zinc-800">
                    <div class="w-14 shrink-0"></div>
                    ${headerCols}
                </div>
                <div class="flex overflow-y-auto" style="max-height: 560px;">
                    <div class="w-14 shrink-0">${hourRows}</div>
                    ${dayCols}
                </div>
            </div>`;
        }

        // ================= (Ngăn cách khối lịch học với phần code phía dưới) =================
        // Bọc an toàn lucide.createIcons(): nếu thư viện icon chưa tải kịp (mạng chậm,
        // bị chặn quảng cáo...) thì không được để lỗi này làm gián đoạn logic quan trọng khác.
        function safeLucide() {
            try {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } catch (e) {
                console.warn('Lucide icons failed to render:', e);
            }
        }

        // ================= PHÁT ÂM THUẬT NGỮ (TEXT-TO-SPEECH) =================
        function speakText(text) {
            if (!text) return;
            if (!('speechSynthesis' in window)) {
                showToast('Trình duyệt của bạn không hỗ trợ đọc phát âm.', 'volume-x');
                return;
            }
            try {
                window.speechSynthesis.cancel(); // Hủy câu đang đọc dở trước đó, tránh đọc chồng lên nhau
                const utter = new SpeechSynthesisUtterance(text);
                utter.lang = 'en-US';
                utter.rate = 0.9;
                window.speechSynthesis.speak(utter);
            } catch (e) {
                console.warn('Lỗi phát âm:', e);
            }
        }

        // Đọc phát âm 1 thẻ cụ thể trong 1 bộ thẻ (dùng ở trang danh sách thẻ - study-hub)
        function speakCardTerm(setId, cardId, event) {
            if (event) event.stopPropagation();
            const set = studySets.find(s => s.id === setId);
            const card = set && set.cards.find(c => c.id === cardId);
            if (card) speakText(card.term);
        }

        // Đọc phát âm thẻ đang hiển thị trong phiên học hiện tại (flashcards, tự luận, ôn tập...)
        function speakSessionTerm(event) {
            if (event) event.stopPropagation();
            const card = studySession.cards[studySession.currentIndex];
            if (card) speakText(card.term);
        }

        // ================= GỢI Ý ĐÁP ÁN (dùng cho chế độ Tự luận & Ôn tập kiểu gõ) =================
        // Ví dụ: "extended family" -> "extended ______" (giữ nguyên từ đầu, ẩn các từ còn lại)
        // Với thuật ngữ 1 từ: "meticulous" -> "m__________" (giữ chữ cái đầu)
        function generateHint(term) {
            const words = term.trim().split(/\s+/);
            if (words.length === 1) {
                const w = words[0];
                return w.length <= 1 ? w : w[0] + '_'.repeat(w.length - 1);
            }
            return words.map((w, i) => i === 0 ? w : '_'.repeat(w.length)).join(' ');
        }

        function showLearnHint() {
            const card = studySession.cards[studySession.currentIndex];
            const el = document.getElementById('learn-hint-text');
            if (el && card) el.textContent = generateHint(card.term);
        }

        function showReviewHint() {
            const card = studySession.cards[studySession.currentIndex];
            const el = document.getElementById('review-hint-text');
            if (el && card) el.textContent = generateHint(card.term);
        }

        // Quản lý Trạng thái State Toàn cục
        let currentActivePage = 'dashboard';
        let currentBrowsingSetId = null;
        let studySession = { cards: [], currentIndex: 0, testAnswers: {}, matchCards: [], selectedMatchId: null, startTime: null, correctInLearn: 0 };

        // QUẢN LÝ ĐỔI TRANG (ROUTING ENGINE REAL)
        function switchPage(pageId, optionId = null) {
            currentActivePage = pageId;
            const container = document.getElementById('page-content');

            // Xử lý Highlight Class Active Menu Điều Hướng
            document.querySelectorAll('.nav-btn, #mobile-nav button').forEach(btn => {
                if (btn.getAttribute('data-nav') === pageId) {
                    btn.className = btn.tagName === 'BUTTON' && btn.parentElement.id === 'desktop-nav'
                        ? "nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-500 bg-brand-50 dark:bg-brand-500/10 transition-all"
                        : "flex flex-col items-center gap-1 text-brand-500";
                } else {
                    btn.className = btn.tagName === 'BUTTON' && btn.parentElement.id === 'desktop-nav'
                        ? "nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
                        : "flex flex-col items-center gap-1 text-slate-400";
                }
            });

            // Hiệu ứng Skeleton Loading mượt mà
            container.innerHTML = `
                <div class="space-y-6 py-12 flex flex-col items-center justify-center text-center">
                    <div class="animate-pulse bg-slate-200 dark:bg-zinc-800 h-8 w-48 rounded-md mb-2"></div>
                    <div class="animate-pulse bg-slate-200 dark:bg-zinc-800 h-32 w-full max-w-2xl rounded-3xl"></div>
                </div>`;

            document.getElementById('scroll-container').scrollTop = 0;

            setTimeout(() => {
                renderView(pageId, optionId);
                safeLucide();
            }, 200);
        }

        // ================= THANH ĐIỀU HƯỚNG PHIÊN HỌC DÙNG CHUNG =================
        // Trước đây mỗi chế độ (Tự luận, Ôn tập, Flashcards...) tự vẽ 1 kiểu thanh tiến độ
        // + nút Thoát riêng -> nhìn không đồng bộ. Hàm này dùng chung cho TẤT CẢ chế độ,
        // và có nút quay lại (mũi tên) rõ ràng, dễ bấm để đổi sang chế độ khác ngay.
        function renderSessionTopBar(modeLabel, current, total, exitAction) {
            const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
            const segCount = 5;
            let segs = '';
            for (let i = 0; i < segCount; i++) {
                const segStart = i * (100 / segCount);
                const segEnd = (i + 1) * (100 / segCount);
                let fill = 0;
                if (pct >= segEnd) fill = 100;
                else if (pct > segStart) fill = ((pct - segStart) / (100 / segCount)) * 100;
                segs += `<div class="flex-1 h-2 rounded-full bg-slate-200 dark:bg-zinc-700/60 overflow-hidden"><div class="h-full bg-brand-500 rounded-full transition-all duration-300" style="width:${fill}%"></div></div>`;
            }
            return `
            <div class="flex items-center gap-3">
                <button onclick="${exitAction}" title="Quay lại chọn chế độ khác" class="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-brand-600 hover:border-brand-500/50 transition-all shrink-0 shadow-sm active:scale-95">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i>
                </button>
                <div class="flex-1">
                    <div class="flex justify-between items-center text-xs font-bold text-slate-400 mb-1.5">
                        <span>${escapeHtml(modeLabel)}</span>
                        <span>${current}/${total}</span>
                    </div>
                    <div class="flex gap-1.5">${segs}</div>
                </div>
            </div>`;
        }

        function renderView(pageId, optionId) {
            const container = document.getElementById('page-content');

            if (pageId === 'dashboard') {
                let dueCount = 0;
                let learnedCount = 0;
                studySets.forEach(s => {
                    s.cards.forEach(c => {
                        learnedCount++;
                        if (!c.nextReview || c.nextReview <= Date.now()) dueCount++;
                    });
                });

                let setCardsHtml = '';
                studySets.forEach(set => {
                    setCardsHtml += `
                    <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all cursor-pointer group flex flex-col justify-between h-44" onclick="openStudySet('${set.id}')">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <span class="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md">${escapeHtml(set.category || 'Ngôn ngữ')}</span>
                                <button onclick="event.stopPropagation(); deleteSet('${set.id}')" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                            <h4 class="font-bold text-base group-hover:text-brand-500 transition-colors line-clamp-1">${escapeHtml(set.title)}</h4>
                            <p class="text-xs text-slate-400 mt-1 line-clamp-2">${escapeHtml(set.description || 'Chưa có mô tả ngắn...')}</p>
                        </div>
                        <div class="space-y-1.5 mt-2">
                            <div class="flex justify-between text-[11px] font-medium opacity-70">
                                <span>Tiến độ tổng hợp</span>
                                <span>${set.progress}%</span>
                            </div>
                            <div class="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div class="bg-brand-500 h-full rounded-full" style="width: ${set.progress}%"></div>
                            </div>
                        </div>
                    </div>`;
                });

                container.innerHTML = `
                <div class="space-y-6">
                    <div class="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-brand-600 dark:to-zinc-900 text-white p-8 rounded-3xl shadow-sm relative overflow-hidden">
                        <div class="relative z-10 max-w-md space-y-2">
                            <span class="text-xs font-semibold tracking-wider uppercase opacity-60">Chào mừng trở lại, Hùng</span>
                            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">Hôm nay học gì để phá kỷ lục bản thân?</h2>
                            <p class="text-sm opacity-80 pt-1">Mục tiêu hôm nay: Giải quyết gọn gàng các thuật ngữ đến hạn ôn tập Spaced Repetition.</p>
                        </div>
                        <div class="absolute right-6 bottom-0 opacity-10 pointer-events-none">
                            <i data-lucide="turtle" class="w-64 h-64"></i>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
                            <div class="p-3 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl"><i data-lucide="layers" class="w-6 h-6"></i></div>
                            <div><div class="text-2xl font-bold">${studySets.length}</div><div class="text-xs text-slate-400 font-medium">Bộ thẻ học tập</div></div>
                        </div>
                        <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
                            <div class="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl"><i data-lucide="check-check" class="w-6 h-6"></i></div>
                            <div><div class="text-2xl font-bold">${learnedCount}</div><div class="text-xs text-slate-400 font-medium">Thuật ngữ hệ thống</div></div>
                        </div>
                        <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
                            <div class="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-xl"><i data-lucide="hourglass" class="w-6 h-6"></i></div>
                            <div><div class="text-2xl font-bold text-amber-500">${dueCount}</div><div class="text-xs text-slate-400 font-medium">Cần ôn hôm nay</div></div>
                        </div>
                        <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
                            <div class="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl"><i data-lucide="award" class="w-6 h-6"></i></div>
                            <div><div class="text-2xl font-bold">96%</div><div class="text-xs text-slate-400 font-medium">Tỷ lệ chính xác</div></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="font-bold text-lg flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4 text-slate-400"></i> Học phần thư viện</h3>
                                <button onclick="switchPage('library')" class="text-xs font-semibold text-brand-500 hover:underline">Xem tất cả</button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="dashboard-sets-list">
                                ${setCardsHtml || '<div class="col-span-full py-10 text-center text-sm text-slate-400">Chưa có bộ thẻ nào. Hãy tạo bộ thẻ đầu tiên!</div>'}
                            </div>
                        </div>
                        <div class="space-y-4">
                            <h3 class="font-bold text-lg flex items-center gap-2"><i data-lucide="target" class="w-4 h-4 text-slate-400"></i> Mục tiêu hôm nay</h3>
                            <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm space-y-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-medium">Ôn tập Spaced Repetition định kỳ</span>
                                    <span class="text-xs font-semibold ${dueCount === 0 ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'text-amber-500 bg-amber-50'} px-2 py-1 rounded-md">${dueCount === 0 ? 'Hoàn tất' : dueCount + ' Từ còn lại'}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-medium">Tạo thêm bộ thẻ nội dung mới</span>
                                    <input type="checkbox" onclick="showToast('Tuyệt vời, hãy bấm Tạo bộ thẻ mới!', 'plus')" class="accent-brand-500 w-4 h-4 rounded-md">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }

            else if (pageId === 'library') {
                let listHtml = '';
                studySets.forEach(set => {
                    listHtml += `
                    <div class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between h-48 hover:shadow-md cursor-pointer transition-all" onclick="openStudySet('${set.id}')">
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-md">${escapeHtml(set.category)}</span>
                                <span class="text-xs text-slate-400">${set.cards.length} thuật ngữ</span>
                            </div>
                            <h3 class="font-bold text-lg line-clamp-1 text-slate-900 dark:text-zinc-100">${escapeHtml(set.title)}</h3>
                            <p class="text-xs text-slate-400 line-clamp-2">${escapeHtml(set.description || 'Không có mô tả cho học phần này.')}</p>
                        </div>
                        <div class="pt-4 border-t border-slate-50 dark:border-zinc-800/50 flex justify-between items-center">
                            <span class="text-xs font-medium text-brand-500">Tiến độ: ${set.progress}%</span>
                            <div class="flex gap-2">
                                <button onclick="event.stopPropagation(); openStudySet('${set.id}')" class="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-brand-500 hover:text-white transition-all"><i data-lucide="play" class="w-3.5 h-3.5"></i></button>
                                <button onclick="event.stopPropagation(); deleteSet('${set.id}')" class="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                            </div>
                        </div>
                    </div>`;
                });

                container.innerHTML = `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold tracking-tight">Thư viện học phần</h2>
                            <p class="text-sm text-slate-400">Nơi lưu trữ toàn bộ kho tàng tri thức của bạn</p>
                        </div>
                        <button onclick="switchPage('create-set')" class="bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm">
                            <i data-lucide="plus" class="w-4 h-4"></i> Tạo bộ thẻ
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${listHtml || '<div class="col-span-full py-12 text-center text-slate-400 text-sm">Chưa có bộ thẻ nào trong thư viện. Hãy tạo ngay!</div>'}
                    </div>
                </div>`;
            }

            else if (pageId === 'create-set') {
                container.innerHTML = `
                <div class="max-w-4xl mx-auto space-y-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold">Tạo bộ thẻ học tập mới</h2>
                            <p class="text-sm text-slate-400">Thiết lập các thuật ngữ cốt lõi và định nghĩa</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="saveNewSet()" class="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all">Lưu & Hoàn tất</button>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/50 space-y-4 shadow-sm">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="sm:col-span-2">
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Tiêu đề học phần</label>
                                <input type="text" id="new-set-title" placeholder="Ví dụ: Từ vựng N3 Chúc Mừng Năm Mới" class="w-full mt-1 bg-slate-50 dark:bg-zinc-800 p-3 rounded-xl outline-none font-semibold text-sm border border-slate-100 dark:border-zinc-800 focus:border-brand-500">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Chủ đề / Danh mục</label>
                                <input type="text" id="new-set-category" placeholder="Ví dụ: Tiếng Nhật" class="w-full mt-1 bg-slate-50 dark:bg-zinc-800 p-3 rounded-xl outline-none font-semibold text-sm border border-slate-100 dark:border-zinc-800 focus:border-brand-500">
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-slate-400 uppercase tracking-wide">Mô tả chi tiết</label>
                            <textarea id="new-set-desc" placeholder="Thêm mô tả ngắn gọn giúp định hình học phần..." class="w-full mt-1 bg-slate-50 dark:bg-zinc-800 p-3 rounded-xl outline-none text-sm h-16 border border-slate-100 dark:border-zinc-800 focus:border-brand-500 resize-none"></textarea>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-bold opacity-60 flex items-center gap-2">
                                <i data-lucide="zap" class="w-4 h-4 text-amber-500 fill-amber-500"></i> Nhập nhanh dữ liệu nâng cao
                            </h3>
                            <button type="button" id="btn-toggle-import" onclick="toggleImportArea()" class="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                                <i data-lucide="eye" class="w-3.5 h-3.5"></i> Mở khung nhập
                            </button>
                        </div>
                        <div id="import-area" class="hidden space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                            <label class="text-xs font-bold text-slate-400 uppercase tracking-wide block">Dán văn bản (Từ Word, Excel, Google Docs...)</label>
                            <textarea id="import-text" rows="5" placeholder="Từ 1 [Tab hoặc dấu tách] Định nghĩa 1&#10;Từ 2 [Tab hoặc dấu tách] Định nghĩa 2" class="w-full bg-slate-50 dark:bg-zinc-800 p-3 rounded-xl outline-none text-sm border border-slate-100 dark:border-zinc-800 focus:border-brand-500 font-mono"></textarea>

                            <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-800/30 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                <div class="flex items-center gap-6 text-sm">
                                    <span class="font-medium text-xs text-slate-400 uppercase">Ký tự phân tách:</span>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="delimiter" value="tab" checked class="accent-brand-500"> Tab
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="delimiter" value="comma" class="accent-brand-500"> Dấu phẩy (,)
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="delimiter" value="dash" class="accent-brand-500"> Gạch ngang (-)
                                    </label>
                                </div>
                                <button type="button" onclick="executeImport()" class="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5">
                                    <i data-lucide="file-check" class="w-3.5 h-3.5"></i> Xác nhận import
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-bold opacity-60">Thuật ngữ thẻ thành phần</span>
                            <button onclick="addCardRowToCreator()" class="text-xs font-bold text-brand-500 flex items-center gap-1 hover:underline"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Thêm hàng mới</button>
                        </div>
                        <div id="creator-cards-list" class="space-y-3"></div>
                    </div>
                </div>`;
                addCardRowToCreator();
                addCardRowToCreator();
                addCardRowToCreator();
                safeLucide();
            }

            else if (pageId === 'study-hub') {
                const set = studySets.find(s => s.id === optionId);
                if (!set) return switchPage('dashboard');
                currentBrowsingSetId = optionId;

                container.innerHTML = `
                <div class="max-w-4xl mx-auto space-y-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-xs font-bold uppercase text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-md">${escapeHtml(set.category)}</span>
                            <h2 class="text-2xl font-bold tracking-tight mt-1">${escapeHtml(set.title)}</h2>
                        </div>
                        <button onclick="switchPage('library')" class="text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"><i data-lucide="arrow-left" class="w-4 h-4"></i> Trở về</button>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <button onclick="startStudySession('flashcards')" ${set.cards.length === 0 ? 'disabled' : ''} class="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-brand-500/40 transition-all group shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                            <div class="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="copy" class="w-5 h-5"></i></div>
                            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">Flashcards 3D</span>
                        </button>
                        <button onclick="startStudySession('learn')" ${set.cards.length === 0 ? 'disabled' : ''} class="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-blue-500/40 transition-all group shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="brain-circuit" class="w-5 h-5"></i></div>
                            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">Tự luận</span>
                        </button>
                        <button onclick="startReviewSessionEntry('${set.id}')" ${set.cards.length === 0 ? 'disabled' : ''} class="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-teal-500/40 transition-all group shadow-sm disabled:opacity-40 disabled:cursor-not-allowed relative">
                            ${hasReviewProgress(set.id) ? '<span class="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full"></span>' : ''}
                            <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="graduation-cap" class="w-5 h-5"></i></div>
                            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">Ôn tập</span>
                        </button>
                        <button onclick="startStudySession('test')" ${set.cards.length < 2 ? 'disabled' : ''} class="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-purple-500/40 transition-all group shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="file-text" class="w-5 h-5"></i></div>
                            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">Bài thi thử</span>
                        </button>
                        <button onclick="startStudySession('match')" ${set.cards.length < 2 ? 'disabled' : ''} class="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-amber-500/40 transition-all group shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="zap" class="w-5 h-5"></i></div>
                            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">Trò chơi Ghép thẻ</span>
                        </button>
                    </div>

                    <div class="space-y-3">
                        <h3 class="font-bold text-sm uppercase text-slate-400 tracking-wider">Danh sách các thẻ (${set.cards.length})</h3>
                        <div class="space-y-2">
                            ${set.cards.length ? set.cards.map((c, idx) => `
                            <div class="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div class="flex gap-4 items-start">
                                    <span class="text-xs font-bold text-slate-300 mt-0.5">${idx + 1}</span>
                                    <button onclick="speakCardTerm('${set.id}', '${c.id}', event)" class="w-7 h-7 shrink-0 rounded-full bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 flex items-center justify-center transition-all mt-0.5" title="Nghe phát âm"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i></button>
                                    <div>
                                        <div class="font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(c.term)}</div>
                                        <div class="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">${escapeHtml(c.definition)}</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 self-end sm:self-auto">
                                    <span class="text-[11px] bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded text-slate-400">Khoảng cách: ${c.interval} ngày</span>
                                </div>
                            </div>
                            `).join('') : '<div class="text-center py-10 text-sm text-slate-400">Bộ thẻ này chưa có thuật ngữ nào.</div>'}
                        </div>
                    </div>
                </div>`;
            }

            // CHẾ ĐỘ FLASHCARDS LẬT MẶT NÂNG CAO
            else if (pageId === 'session-flashcards') {
                const card = studySession.cards[studySession.currentIndex];
                const total = studySession.cards.length;

                container.innerHTML = `
                <div class="max-w-2xl mx-auto space-y-6">
                    ${renderSessionTopBar('Flashcards 3D', studySession.currentIndex + 1, total, `switchPage('study-hub', '${currentBrowsingSetId}')`)}

                    <div class="h-80 w-full perspective-1000 cursor-pointer" onclick="flipFlashcard()">
                        <div id="flashcard-inner" class="w-full h-full transform-style-3d transition-transform duration-500 relative bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl shadow-sm">
                            <div class="absolute inset-0 backface-hidden flex flex-col justify-center items-center p-8">
                                <span class="text-[10px] font-bold tracking-widest uppercase text-slate-300 absolute top-6">Mặt trước (Thuật ngữ)</span>
                                <button onclick="speakSessionTerm(event)" class="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 flex items-center justify-center transition-all" title="Nghe phát âm"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                                <h3 class="text-3xl font-extrabold text-center text-slate-900 dark:text-zinc-50">${escapeHtml(card.term)}</h3>
                                <span class="text-xs text-slate-400 mt-4 flex items-center gap-1 opacity-60"><i data-lucide="refresh-cw" class="w-3 h-3"></i> Bấm để lật xem định nghĩa</span>
                            </div>
                            <div class="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-center items-center p-8 bg-slate-50/50 dark:bg-zinc-900/50">
                                <span class="text-[10px] font-bold tracking-widest uppercase text-brand-500 absolute top-6">Mặt sau (Định nghĩa)</span>
                                <p class="text-xl font-medium text-center text-slate-800 dark:text-zinc-200 max-w-md">${escapeHtml(card.definition)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-center text-xs font-bold text-slate-400 uppercase tracking-wide">Đánh giá độ khó để đặt lịch Spaced Repetition:</div>
                        <div class="grid grid-cols-4 gap-2">
                            <button onclick="handleSpacedRepetitionScore(1)" class="bg-rose-500 text-white p-3 rounded-xl font-bold text-xs hover:bg-rose-600 transition-all active:scale-95">Quá khó<br><span class="text-[9px] font-normal opacity-70">Lặp lại ngay</span></button>
                            <button onclick="handleSpacedRepetitionScore(2)" class="bg-amber-500 text-white p-3 rounded-xl font-bold text-xs hover:bg-amber-600 transition-all active:scale-95">Tạm được<br><span class="text-[9px] font-normal opacity-70">Sớm xem lại</span></button>
                            <button onclick="handleSpacedRepetitionScore(3)" class="bg-blue-500 text-white p-3 rounded-xl font-bold text-xs hover:bg-blue-600 transition-all active:scale-95">Nhớ tốt<br><span class="text-[9px] font-normal opacity-70">Vài ngày sau</span></button>
                            <button onclick="handleSpacedRepetitionScore(4)" class="bg-brand-500 text-white p-3 rounded-xl font-bold text-xs hover:bg-brand-600 transition-all active:scale-95">Quá dễ<br><span class="text-[9px] font-normal opacity-70">Tự tin thuộc</span></button>
                        </div>
                    </div>
                </div>`;
            }

            // CHẾ ĐỘ HỌC GÕ PHÍM / WRITE / LEARN
            else if (pageId === 'session-learn') {
                const card = studySession.cards[studySession.currentIndex];
                const total = studySession.cards.length;

                container.innerHTML = `
                <div class="max-w-xl mx-auto space-y-6">
                    ${renderSessionTopBar('Chế độ tự luận', studySession.currentIndex + 1, total, `switchPage('study-hub', '${currentBrowsingSetId}')`)}
                    <div class="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div>
                            <div class="text-xs uppercase font-bold text-slate-400 mb-2">Định nghĩa gợi ý</div>
                            <h3 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(card.definition)}</h3>
                        </div>

                        <div class="space-y-2">
                            <label class="text-xs uppercase font-bold text-slate-400">Nhập thuật ngữ tương ứng:</label>
                            <input type="text" id="learn-input" autofocus autocomplete="off" placeholder="Gõ câu trả lời bằng tiếng Anh / thuật ngữ gốc..." class="w-full p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none rounded-xl text-base font-semibold text-slate-900 dark:text-zinc-100 focus:border-brand-500 transition-all">
                            <div id="learn-feedback" class="text-sm font-medium min-h-[20px]"></div>
                            <div class="flex items-center gap-2 pt-1">
                                <button type="button" onclick="showLearnHint()" class="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"><i data-lucide="lightbulb" class="w-3.5 h-3.5"></i> Xem gợi ý</button>
                                <span id="learn-hint-text" class="text-sm font-mono tracking-widest text-slate-400"></span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                            <button onclick="switchPage('study-hub', '${currentBrowsingSetId}')" class="text-xs font-medium text-slate-400 hover:underline flex items-center gap-1"><i data-lucide="log-out" class="w-3.5 h-3.5"></i> Thoát tự luận</button>
                            <button onclick="skipLearnCard()" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Bỏ qua câu này</button>
                        </div>

                        <button onclick="checkLearnAnswer()" class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold transition-all active:scale-[0.99]">Kiểm tra đáp án</button>
                    </div>
                </div>`;

                const learnInput = document.getElementById('learn-input');
                learnInput.focus();
                learnInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') checkLearnAnswer();
                });
            }

            // CHẾ ĐỘ THI THỬ / TEST (TRẮC NGHIỆM + TỰ LUẬN TRỘN LẪN)
            else if (pageId === 'session-test') {
                let testHtml = '';
                studySession.cards.forEach((card, idx) => {
                    const qType = studySession.testTypes[card.id] || 'mc';

                    if (qType === 'typing') {
                        testHtml += `
                        <div class="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-2xl space-y-3 shadow-sm">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-bold text-slate-400">Câu hỏi ${idx + 1}: <span class="text-blue-500">(Tự luận)</span></div>
                            </div>
                            <div class="text-lg font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(card.definition)}</div>
                            <input type="text" autocomplete="off" placeholder="Nhập thuật ngữ tương ứng..." oninput="studySession.testAnswers['${card.id}'] = this.value; updateTestProgress();" class="w-full p-3 bg-slate-50 dark:bg-zinc-800 border dark:border-zinc-700 outline-none rounded-xl text-sm font-semibold focus:border-brand-500 transition-all">
                        </div>`;
                    } else {
                        // Tạo tập các phương án nhiễu ngẫu nhiên
                        let options = [card.definition];
                        let pool = studySession.cards.filter(c => c.id !== card.id).map(c => c.definition);
                        pool = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
                        options = [...options, ...pool].sort(() => 0.5 - Math.random());

                        testHtml += `
                        <div class="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-2xl space-y-3 shadow-sm">
                            <div class="text-sm font-bold text-slate-400">Câu hỏi ${idx + 1}: <span class="text-purple-500">(Trắc nghiệm)</span></div>
                            <div class="text-lg font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(card.term)}</div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                ${options.map(opt => `
                                <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all border border-transparent has-[:checked]:border-brand-500/60 has-[:checked]:bg-brand-50/50">
                                    <input type="radio" name="q_${card.id}" value="${escapeHtml(opt)}" onclick="studySession.testAnswers['${card.id}'] = this.value; updateTestProgress();" class="accent-brand-500 w-4 h-4">
                                    <span class="text-sm text-slate-700 dark:text-zinc-300">${escapeHtml(opt)}</span>
                                </label>
                                `).join('')}
                            </div>
                        </div>`;
                    }
                });

                container.innerHTML = `
                <div class="max-w-3xl mx-auto space-y-6">
                    <div class="flex items-center gap-3">
                        <button onclick="switchPage('study-hub', '${currentBrowsingSetId}')" title="Quay lại chọn chế độ khác" class="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-brand-600 hover:border-brand-500/50 transition-all shrink-0 shadow-sm active:scale-95">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        </button>
                        <div>
                            <h2 class="text-xl font-bold">Bài kiểm tra tổng hợp</h2>
                            <p class="text-xs text-slate-400">Trả lời các câu hỏi trắc nghiệm và tự luận bên dưới</p>
                        </div>
                    </div>
                    <div class="space-y-1.5 sticky top-0 z-10 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-sm py-2 -my-2">
                        <div class="flex justify-between text-xs font-bold text-slate-400">
                            <span>Tiến độ làm bài</span>
                            <span id="test-progress-label">0 / ${studySession.cards.length} câu</span>
                        </div>
                        <div class="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div id="test-progress-fill" class="bg-purple-500 h-full rounded-full transition-all" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${testHtml}
                    </div>
                    <button onclick="submitTestSession()" class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold shadow-md shadow-brand-500/10 transition-transform active:scale-[0.99]">Xác nhận nộp bài</button>
                </div>`;
            }

            // CHẾ ĐỘ TRÒ CHƠI GHÉP THẺ MATCHING GAME
            else if (pageId === 'session-match') {
                container.innerHTML = `
                <div class="max-w-4xl mx-auto space-y-4">
                    <div class="flex flex-wrap justify-between items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="switchPage('study-hub', '${currentBrowsingSetId}')" title="Quay lại chọn chế độ khác" class="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-brand-600 hover:border-brand-500/50 transition-all shrink-0 shadow-sm active:scale-95">
                                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                            </button>
                            <div>
                                <h2 class="text-lg font-bold">Trò chơi Ghép thẻ tốc độ</h2>
                                <p class="text-xs text-slate-400">Chọn 1 ô thuật ngữ rồi chọn ô định nghĩa tương ứng để triệt tiêu</p>
                            </div>
                        </div>
                        <div class="text-sm font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-200/50">
                            Thời gian: <span id="match-timer">0.0s</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2" id="match-grid-container">
                        </div>
                </div>`;
                renderMatchGrid();
                startMatchTimer();
            }

            // CHẾ ĐỘ ÔN TẬP (REVIEW) - TRẮC NGHIỆM + TỰ LUẬN, PHẢN HỒI NGAY, CÓ LƯU TIẾN ĐỘ
            else if (pageId === 'session-review') {
                const total = studySession.cards.length;
                const idx = studySession.currentIndex;
                const card = studySession.cards[idx];
                const qType = studySession.reviewTypes[idx];
                const answered = studySession.reviewAnswered;

                let bodyHtml = '';
                if (qType === 'typing') {
                    bodyHtml = `
                    <div class="space-y-2">
                        <label class="text-xs uppercase font-bold text-slate-400">Nhập thuật ngữ tương ứng:</label>
                        <input type="text" id="review-typing-input" autocomplete="off" ${answered ? 'disabled' : 'autofocus'}
                            placeholder="Gõ câu trả lời..."
                            class="w-full p-3 bg-slate-50 dark:bg-zinc-800 border ${answered ? (studySession.reviewLastCorrect ? 'border-brand-500' : 'border-rose-500') : 'border-slate-200 dark:border-zinc-700'} outline-none rounded-xl text-base font-semibold focus:border-brand-500 transition-all text-slate-900 dark:text-zinc-100">
                        ${answered ? `<div class="text-sm font-medium ${studySession.reviewLastCorrect ? 'text-brand-600 dark:text-brand-400' : 'text-rose-600 dark:text-rose-400'}">${studySession.reviewLastCorrect ? 'Chính xác!' : 'Đáp án đúng: ' + escapeHtml(card.term)}</div>` : ''}
                        ${!answered ? `
                        <div class="flex items-center gap-2 pt-1">
                            <button type="button" onclick="showReviewHint()" class="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"><i data-lucide="lightbulb" class="w-3.5 h-3.5"></i> Xem gợi ý</button>
                            <span id="review-hint-text" class="text-sm font-mono tracking-widest text-slate-400"></span>
                        </div>` : ''}
                    </div>`;
                } else {
                    const options = studySession.reviewOptions[idx];
                    bodyHtml = `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        ${options.map((opt, i) => {
                            let extraClass = 'border-slate-200 dark:border-zinc-700 hover:border-brand-500/50 bg-slate-50 dark:bg-zinc-800/40';
                            let badgeClass = 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-white';
                            let textClass = 'text-slate-700 dark:text-zinc-200';
                            if (answered) {
                                if (opt === card.term) { extraClass = 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'; textClass = 'text-brand-700 dark:text-zinc-100'; }
                                else if (opt === studySession.reviewSelectedAnswer) { extraClass = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'; textClass = 'text-rose-700 dark:text-zinc-100'; }
                                else { extraClass = 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 opacity-50'; }
                            }
                            return `
                            <button ${answered ? 'disabled' : `onclick="handleReviewMCAnswer(${i})"`} class="text-left p-4 rounded-xl border-2 ${extraClass} transition-all flex items-center gap-3 disabled:cursor-default">
                                <span class="w-6 h-6 rounded-full ${badgeClass} text-xs font-bold flex items-center justify-center shrink-0">${i + 1}</span>
                                <span class="text-sm font-medium ${textClass}">${escapeHtml(opt)}</span>
                            </button>`;
                        }).join('')}
                    </div>`;
                }

                container.innerHTML = `
                <div class="max-w-2xl mx-auto space-y-6">
                    ${renderSessionTopBar('Ôn tập', idx + (answered ? 1 : 0), total, `switchPage('study-hub', '${currentBrowsingSetId}')`)}

                    <div class="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div>
                            <div class="text-xs font-bold uppercase text-slate-400 mb-2">${qType === 'typing' ? 'Thuật ngữ' : 'Định nghĩa'}</div>
                            <h3 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(qType === 'typing' ? card.definition : card.definition)}</h3>
                        </div>

                        <div>
                            <div class="text-xs font-bold uppercase text-slate-400 mb-3">${qType === 'typing' ? 'Nhập đáp án' : 'Chọn đáp án đúng'}</div>
                            ${bodyHtml}
                        </div>

                        <div class="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                            <button onclick="switchPage('study-hub', '${currentBrowsingSetId}')" class="text-xs font-medium text-slate-400 hover:underline flex items-center gap-1"><i data-lucide="log-out" class="w-3.5 h-3.5"></i> Thoát ôn tập</button>
                            ${!answered ? `<button onclick="revealReviewAnswer()" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Bạn không biết?</button>` : ''}
                        </div>

                        ${qType === 'typing' && !answered ? `<button onclick="checkReviewTypingAnswer()" class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold transition-all active:scale-[0.99]">Kiểm tra đáp án</button>` : ''}
                        ${answered ? `<button onclick="continueReviewAfterFeedback()" class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2">Tiếp tục <i data-lucide="arrow-right" class="w-4 h-4"></i></button>` : ''}
                    </div>
                </div>`;

                if (qType === 'typing' && !answered) {
                    const inp = document.getElementById('review-typing-input');
                    if (inp) {
                        inp.focus();
                        inp.addEventListener('keypress', function(e) { if (e.key === 'Enter') checkReviewTypingAnswer(); });
                    }
                }
            }

            // TRANG SPACED REPETITION: DANH SÁCH TỪ ĐẾN HẠN + PHÂN BỐ MỐC LẶP
            else if (pageId === 'spaced-repetition') {
                let listDueHtml = '';
                let counter = 0;
                const intervalBuckets = { '1 ngày': 0, '2-3 ngày': 0, '4-7 ngày': 0, '> 7 ngày': 0 };
                studySets.forEach(s => {
                    s.cards.forEach(c => {
                        if (!c.nextReview || c.nextReview <= Date.now()) {
                            counter++;
                            listDueHtml += `
                            <div class="p-3 bg-white dark:bg-zinc-900 border rounded-xl flex justify-between items-center text-sm">
                                <div>
                                    <span class="font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(c.term)}</span>
                                    <span class="text-xs text-slate-400 block sm:inline sm:ml-2">(${escapeHtml(s.title)})</span>
                                </div>
                                <button onclick="openStudySet('${s.id}')" class="text-xs font-bold text-brand-500 hover:underline flex items-center gap-0.5">Ôn ngay <i data-lucide="chevron-right" class="w-3 h-3"></i></button>
                            </div>`;
                        }
                        const iv = c.interval || 1;
                        if (iv <= 1) intervalBuckets['1 ngày']++;
                        else if (iv <= 3) intervalBuckets['2-3 ngày']++;
                        else if (iv <= 7) intervalBuckets['4-7 ngày']++;
                        else intervalBuckets['> 7 ngày']++;
                    });
                });
                const maxBucket = Math.max(1, ...Object.values(intervalBuckets));

                container.innerHTML = `
                <div class="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h2 class="text-2xl font-bold tracking-tight">Hệ thống thuật toán lặp lại ngắt quãng</h2>
                        <p class="text-sm text-slate-400">Theo dõi tiến độ ghi nhớ dài hạn dựa trên thuật toán SuperMemo</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div class="bg-white dark:bg-zinc-900 border p-5 rounded-2xl space-y-3 shadow-sm">
                            <h3 class="font-bold text-sm text-slate-400 uppercase tracking-wide">Phân bố mốc ôn tiếp theo (thật)</h3>
                            <div class="h-40 flex items-end justify-between gap-2 pt-4">
                                ${Object.entries(intervalBuckets).map(([label, n]) => `
                                    <div class="w-full flex flex-col items-center gap-2">
                                        <div class="w-full bg-brand-500 rounded-t-lg transition-all" style="height: ${Math.max(4, Math.round((n / maxBucket) * 100))}%"></div>
                                        <span class="text-[10px] font-medium text-slate-400 text-center">${label}</span>
                                        <span class="text-[10px] font-bold text-slate-500 dark:text-zinc-400">${n}</span>
                                    </div>`).join('')}
                            </div>
                        </div>

                        <div class="bg-white dark:bg-zinc-900 border p-5 rounded-2xl space-y-3 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 class="font-bold text-sm text-slate-400 uppercase tracking-wide">Danh sách từ đợi ôn ngắt quãng (${counter})</h3>
                                <p class="text-xs text-slate-400 mt-1">Các từ vựng đã tới thời điểm não bộ chuẩn bị quên theo đồ thị lặp lại.</p>
                            </div>
                            <div class="space-y-2 max-h-40 overflow-y-auto no-scrollbar pt-2">
                                ${listDueHtml || '<div class="text-center py-6 text-xs text-slate-400">Tuyệt diệu! Không còn từ nào bị tồn đọng quá hạn.</div>'}
                            </div>
                        </div>
                    </div>
                </div>`;
            }

            // TRANG THỐNG KÊ & STREAK: BIỂU ĐỒ TUẦN THẬT + STREAK THẬT + TỔNG QUAN
            else if (pageId === 'analytics') {
                const week = getLast7DaysActivity();
                const maxCount = Math.max(1, ...week.map(d => d.count));
                const streak = computeStreak();
                let totalCards = 0, dueNow = 0;
                studySets.forEach(s => s.cards.forEach(c => {
                    totalCards++;
                    if (!c.nextReview || c.nextReview <= Date.now()) dueNow++;
                }));
                const totalReviewsEver = Object.values(dailyActivity).reduce((a, b) => a + b, 0);

                container.innerHTML = `
                <div class="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h2 class="text-2xl font-bold tracking-tight">Thống kê & Streak</h2>
                        <p class="text-sm text-slate-400">Số liệu được tính trực tiếp từ lịch sử học tập thật của bạn trên máy này.</p>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div class="bg-white dark:bg-zinc-900 border p-4 rounded-2xl text-center shadow-sm">
                            <div class="text-2xl font-bold text-orange-500">${streak}</div>
                            <div class="text-[11px] text-slate-400 mt-1 uppercase font-semibold">Ngày liên tiếp</div>
                        </div>
                        <div class="bg-white dark:bg-zinc-900 border p-4 rounded-2xl text-center shadow-sm">
                            <div class="text-2xl font-bold text-brand-500">${totalCards}</div>
                            <div class="text-[11px] text-slate-400 mt-1 uppercase font-semibold">Tổng thuật ngữ</div>
                        </div>
                        <div class="bg-white dark:bg-zinc-900 border p-4 rounded-2xl text-center shadow-sm">
                            <div class="text-2xl font-bold text-rose-500">${dueNow}</div>
                            <div class="text-[11px] text-slate-400 mt-1 uppercase font-semibold">Đến hạn ôn</div>
                        </div>
                        <div class="bg-white dark:bg-zinc-900 border p-4 rounded-2xl text-center shadow-sm">
                            <div class="text-2xl font-bold text-indigo-500">${totalReviewsEver}</div>
                            <div class="text-[11px] text-slate-400 mt-1 uppercase font-semibold">Lượt ôn tất cả thời gian</div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-zinc-900 border p-5 rounded-2xl space-y-3 shadow-sm">
                        <h3 class="font-bold text-sm text-slate-400 uppercase tracking-wide">Số thẻ đã ôn — 7 ngày gần nhất</h3>
                        <div class="h-40 flex items-end justify-between gap-2 pt-4">
                            ${week.map(d => `
                                <div class="w-full flex flex-col items-center gap-2">
                                    <div class="w-full ${d.label === 'Hôm nay' ? 'bg-brand-600 shadow-md shadow-brand-500/20' : (d.count > 0 ? 'bg-brand-500' : 'bg-slate-100 dark:bg-zinc-800')} rounded-t-lg transition-all" style="height: ${d.count > 0 ? Math.max(6, Math.round((d.count / maxCount) * 100)) : 4}%"></div>
                                    <span class="text-[10px] font-medium ${d.label === 'Hôm nay' ? 'text-brand-500 font-bold' : 'text-slate-400'}">${d.label}</span>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>`;
            }

            else if (pageId === 'study-calendar') {
                let periodLabel = '';
                let mainHtml = '';

                if (calendarViewMode === 'month') {
                    periodLabel = calendarViewDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
                    mainHtml = renderMonthGrid();
                } else if (calendarViewMode === 'week') {
                    const weekStart = startOfWeek(calendarViewDate);
                    const days = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(weekStart); d.setDate(d.getDate() + i); return ymdKey(d);
                    });
                    const first = new Date(days[0] + 'T00:00:00'), last = new Date(days[6] + 'T00:00:00');
                    const sameMonth = first.getMonth() === last.getMonth();
                    periodLabel = sameMonth
                        ? `${first.getDate()} - ${last.getDate()} Thg ${last.getMonth() + 1}, ${last.getFullYear()}`
                        : `${first.getDate()} Thg ${first.getMonth() + 1} - ${last.getDate()} Thg ${last.getMonth() + 1}, ${last.getFullYear()}`;
                    mainHtml = renderTimeGrid(days);
                } else {
                    const key = ymdKey(calendarViewDate);
                    periodLabel = calendarViewDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                    mainHtml = renderTimeGrid([key]);
                }

                const modeBtn = (m, label) => `<button onclick="setCalendarView('${m}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${calendarViewMode === m ? 'bg-white dark:bg-zinc-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}">${label}</button>`;

                container.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                    <div class="hidden lg:block space-y-4">
                        <button onclick="openEventModal(null, '${ymdKey(calendarViewDate)}')" class="w-full bg-slate-900 hover:bg-slate-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]">
                            <i data-lucide="plus" class="w-4 h-4"></i><span>Thêm lịch học</span>
                        </button>
                        ${renderMiniCalendar()}
                    </div>

                    <div class="space-y-4 min-w-0">
                        <div class="flex items-center justify-between flex-wrap gap-3">
                            <div class="flex items-center gap-2">
                                <button onclick="goToToday()" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">Hôm nay</button>
                                <button onclick="changeCalendarPeriod(-1)" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                                <button onclick="changeCalendarPeriod(1)" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
                                <h2 class="text-lg font-bold tracking-tight capitalize ml-1">${periodLabel}</h2>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                                    ${modeBtn('month', 'Tháng')}${modeBtn('week', 'Tuần')}${modeBtn('day', 'Ngày')}
                                </div>
                                <button onclick="openEventModal(null, '${ymdKey(calendarViewDate)}')" class="lg:hidden w-9 h-9 rounded-xl bg-slate-900 dark:bg-brand-500 text-white flex items-center justify-center"><i data-lucide="plus" class="w-4 h-4"></i></button>
                            </div>
                        </div>

                        ${mainHtml}
                    </div>
                </div>`;
            }

            else if (pageId === 'settings') {
                container.innerHTML = `
                <div class="max-w-2xl mx-auto space-y-6">
                    <div>
                        <h2 class="text-xl font-bold">Cài đặt hệ thống</h2>
                        <p class="text-sm text-slate-400">Tùy biến trải nghiệm học tập nâng cao của cá nhân</p>
                    </div>
                    <div class="bg-white dark:bg-zinc-900 border p-6 rounded-2xl space-y-4 shadow-sm">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-bold text-sm">Chế độ tối</div>
                                <div class="text-xs text-slate-400">Chuyển đổi giao diện sáng / tối cho toàn bộ ứng dụng.</div>
                            </div>
                            <button onclick="toggleDarkMode()" class="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors">Chuyển đổi</button>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-zinc-900 border p-6 rounded-2xl space-y-4 shadow-sm">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-bold text-sm">Xóa toàn bộ dữ liệu ứng dụng</div>
                                <div class="text-xs text-slate-400">Khôi phục cài đặt gốc và các bộ thẻ mặc định thuở sơ khai.</div>
                            </div>
                            <button onclick="resetAllDataData()" class="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">Reset Data</button>
                        </div>
                    </div>
                </div>`;
            }
        }

        // ============ TẠO BỘ THẺ MỚI & THÊM DÒNG ============
        function addCardRowToCreator(term = '', def = '') {
            const list = document.getElementById('creator-cards-list');
            if (!list) return;
            const rowCount = list.children.length + 1;
            const div = document.createElement('div');
            div.className = "bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex gap-4 items-center shadow-sm relative group page-fade";
            div.innerHTML = `
                <span class="font-bold text-slate-300 min-w-[16px]">${rowCount}</span>
                <input type="text" placeholder="Nhập thuật ngữ (ví dụ: Turtle)" value="${escapeHtml(term)}" class="creator-term flex-1 bg-transparent border-b border-slate-200 dark:border-zinc-800 py-1 outline-none text-sm font-semibold focus:border-brand-500 transition-colors">
                <input type="text" placeholder="Nhập ý nghĩa định nghĩa" value="${escapeHtml(def)}" class="creator-def flex-1 bg-transparent border-b border-slate-200 dark:border-zinc-800 py-1 outline-none text-sm focus:border-brand-500 transition-colors">
                <button onclick="this.parentElement.remove(); updateCreatorRowNumbers();" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"><i data-lucide="x" class="w-4 h-4"></i></button>
            `;
            list.appendChild(div);
            safeLucide();
        }

        function updateCreatorRowNumbers() {
            const list = document.getElementById('creator-cards-list');
            Array.from(list.children).forEach((child, idx) => {
                child.querySelector('span').innerText = idx + 1;
            });
        }

        function toggleImportArea() {
            const area = document.getElementById('import-area');
            const btn = document.getElementById('btn-toggle-import');
            if (!area || !btn) return;

            if (area.classList.contains('hidden')) {
                area.classList.remove('hidden');
                btn.innerHTML = `<i data-lucide="eye-off" class="w-3.5 h-3.5"></i> Đóng khung nhập`;
            } else {
                area.classList.add('hidden');
                btn.innerHTML = `<i data-lucide="eye" class="w-3.5 h-3.5"></i> Mở khung nhập`;
            }
            safeLucide();
        }

        function executeImport() {
            const textInput = document.getElementById('import-text');
            if (!textInput) return;

            const text = textInput.value.trim();
            if (!text) {
                showToast('Vui lòng nhập văn bản trước khi import!', 'alert-circle');
                return;
            }

            const delimiterRadio = document.querySelector('input[name="delimiter"]:checked');
            const delimiterType = delimiterRadio ? delimiterRadio.value : 'tab';
            let delimiter = '\t';
            if (delimiterType === 'comma') delimiter = ',';
            if (delimiterType === 'dash') delimiter = '-';

            const lines = text.split('\n');
            const list = document.getElementById('creator-cards-list');
            if (!list) return;

            // Làm sạch các hàng trống cũ để đẩy data mới vào
            list.innerHTML = '';

            let count = 0;
            lines.forEach(line => {
                const parts = line.split(delimiter);
                if (parts.length >= 2) {
                    const term = parts[0].trim();
                    const def = parts.slice(1).join(delimiter).trim();
                    if (term && def) {
                        addCardRowToCreator(term, def);
                        count++;
                    }
                }
            });

            if (count > 0) {
                showToast(`Đã import thành công ${count} thuật ngữ!`, 'check');
                textInput.value = '';
                toggleImportArea();
            } else {
                showToast('Không tìm thấy dữ liệu hợp lệ. Kiểm tra ký tự phân tách!', 'alert-circle');
                addCardRowToCreator();
            }
        }

        function saveNewSet() {
            const title = document.getElementById('new-set-title').value.trim();
            const category = document.getElementById('new-set-category').value.trim() || "Chung";
            const description = document.getElementById('new-set-desc').value.trim();

            if (!title) return showToast("Vui lòng không bỏ trống Tiêu đề bộ thẻ!", "alert-triangle");

            const terms = document.querySelectorAll('.creator-term');
            const defs = document.querySelectorAll('.creator-def');
            let cards = [];

            terms.forEach((termInput, index) => {
                const tVal = termInput.value.trim();
                const dVal = defs[index].value.trim();
                if (tVal && dVal) {
                    cards.push({
                        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        term: tVal,
                        definition: dVal,
                        interval: 1,
                        easeFactor: 2.5,
                        nextReview: Date.now()
                    });
                }
            });

            if (cards.length === 0) return showToast("Học phần phải có ít nhất một cặp thẻ hợp lệ!", "alert-triangle");

            const newSet = {
                id: 'set_' + Date.now(),
                title: title,
                category: category,
                description: description,
                progress: 0,
                cards: cards
            };

            studySets.unshift(newSet);
            saveToStorage();
            showToast("Đã lưu và khởi tạo bộ thẻ thành công!", "check-circle");
            switchPage('dashboard');
        }

        // XÓA BỘ THẺ
        function deleteSet(setId) {
            if (confirm("Bạn có chắc chắn muốn giải tán bộ thẻ học tập này?")) {
                studySets = studySets.filter(s => s.id !== setId);
                saveToStorage();
                showToast("Đã xóa bộ thẻ học.", "trash-2");
                if (currentActivePage === 'dashboard' || currentActivePage === 'library') {
                    renderView(currentActivePage);
                    safeLucide();
                } else {
                    switchPage('dashboard');
                }
            }
        }

        // ĐIỀU HƯỚNG VÀO STUDY HUB CỦA BỘ THẺ ĐÓ
        function openStudySet(setId) {
            switchPage('study-hub', setId);
        }

        // KÍCH HOẠT CHẾ ĐỘ HỌC CON
        function startStudySession(mode) {
            const set = studySets.find(s => s.id === currentBrowsingSetId);
            if (!set || set.cards.length === 0) return showToast("Bộ thẻ trống rỗng, chưa thể kích hoạt học!", "alert-triangle");
            if ((mode === 'test' || mode === 'match') && set.cards.length < 2) return showToast("Cần ít nhất 2 thuật ngữ để chơi chế độ này!", "alert-triangle");

            studySession.cards = [...set.cards].sort(() => 0.5 - Math.random());
            studySession.currentIndex = 0;
            studySession.testAnswers = {};
            studySession.testTypes = {};
            studySession.startTime = Date.now();
            studySession.correctInLearn = 0;

            if (mode === 'flashcards') switchPage('session-flashcards');
            if (mode === 'learn') switchPage('session-learn');
            if (mode === 'test') {
                // Trộn ngẫu nhiên giữa câu trắc nghiệm và câu tự luận trong bài thi thử
                studySession.cards.forEach(c => {
                    studySession.testTypes[c.id] = (set.cards.length >= 2 && Math.random() < 0.65) ? 'mc' : 'typing';
                });
                switchPage('session-test');
            }
            if (mode === 'match') {
                // Chuẩn bị dữ liệu hỗn hợp cho matching game
                let matchCards = [];
                const shuffledSetCards = [...set.cards].sort(() => 0.5 - Math.random());
                const maxCards = shuffledSetCards.slice(0, 6); // Lấy tối đa 6 thẻ làm 12 ô tránh loãng giao diện
                maxCards.forEach(c => {
                    matchCards.push({ id: c.id, type: 'term', text: c.term });
                    matchCards.push({ id: c.id, type: 'def', text: c.definition });
                });
                studySession.matchCards = matchCards.sort(() => 0.5 - Math.random());
                switchPage('session-match');
            }
        }

        // ============ CHẾ ĐỘ ÔN TẬP (REVIEW): LƯU/TIẾP TỤC + TRỘN MC/TỰ LUẬN ============
        function getReviewStorageKey(setId) { return `ruanho_review_${setId}`; }

        function hasReviewProgress(setId) {
            try {
                const raw = localStorage.getItem(getReviewStorageKey(setId));
                if (!raw) return false;
                const data = JSON.parse(raw);
                return data && Array.isArray(data.cardOrder) && data.currentIndex < data.cardOrder.length;
            } catch (e) { return false; }
        }

        function saveReviewProgress() {
            if (!currentBrowsingSetId || !studySession.reviewCardOrder) return;
            const data = {
                cardOrder: studySession.reviewCardOrder,
                types: studySession.reviewTypes,
                currentIndex: studySession.currentIndex,
                correctCount: studySession.reviewCorrectCount,
                batchCorrect: studySession.reviewBatchCorrect,
                total: studySession.cards.length,
                timestamp: Date.now()
            };
            try { localStorage.setItem(getReviewStorageKey(currentBrowsingSetId), JSON.stringify(data)); } catch (e) {}
        }

        function clearReviewProgress(setId) {
            localStorage.removeItem(getReviewStorageKey(setId));
        }

        function loadReviewProgress(setId) {
            try {
                const raw = localStorage.getItem(getReviewStorageKey(setId));
                return raw ? JSON.parse(raw) : null;
            } catch (e) { return null; }
        }

        // Điểm vào chế độ Ôn tập: kiểm tra xem có tiến độ dở dang không, nếu có thì hỏi người dùng
        function startReviewSessionEntry(setId) {
            const set = studySets.find(s => s.id === setId);
            if (!set || set.cards.length === 0) return showToast("Bộ thẻ trống rỗng, chưa thể ôn tập!", "alert-triangle");
            currentBrowsingSetId = setId;

            const saved = loadReviewProgress(setId);
            if (saved && saved.currentIndex < saved.cardOrder.length) {
                showResultModal('history', 'Tiếp tục ôn tập?', `Bạn đã làm đến câu ${saved.currentIndex + 1}/${saved.total} lần trước. Bạn muốn tiếp tục hay khởi động lại từ đầu?`, [
                    { label: 'Khởi động lại', action: `startFreshReviewSession('${setId}')` },
                    { label: 'Tiếp tục', action: `resumeReviewSession('${setId}')`, primary: true }
                ]);
            } else {
                startFreshReviewSession(setId);
            }
        }

        function buildReviewTypesForCards(cards) {
            // Trộn ngẫu nhiên câu trắc nghiệm và câu tự luận; nếu bộ thẻ quá ít thì ưu tiên tự luận
            const types = [];
            const options = [];
            cards.forEach(card => {
                const type = (cards.length >= 3 && Math.random() < 0.6) ? 'mc' : 'typing';
                types.push(type);
                if (type === 'mc') {
                    let opts = [card.term];
                    let pool = cards.filter(c => c.id !== card.id).map(c => c.term);
                    pool = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
                    opts = [...opts, ...pool].sort(() => 0.5 - Math.random());
                    options.push(opts);
                } else {
                    options.push(null);
                }
            });
            return { types, options };
        }

        function startFreshReviewSession(setId) {
            const set = studySets.find(s => s.id === setId);
            if (!set) return;
            currentBrowsingSetId = setId;
            clearReviewProgress(setId);

            const shuffled = [...set.cards].sort(() => 0.5 - Math.random());
            const { types, options } = buildReviewTypesForCards(shuffled);

            studySession.cards = shuffled;
            studySession.reviewCardOrder = shuffled.map(c => c.id);
            studySession.reviewTypes = types;
            studySession.reviewOptions = options;
            studySession.currentIndex = 0;
            studySession.reviewCorrectCount = 0;
            studySession.reviewBatchCorrect = 0;
            studySession.reviewAnswered = false;
            studySession.reviewLastCorrect = false;
            studySession.reviewSelectedAnswer = null;

            saveReviewProgress();
            switchPage('session-review');
        }

        function resumeReviewSession(setId) {
            const set = studySets.find(s => s.id === setId);
            const saved = loadReviewProgress(setId);
            if (!set || !saved) return startFreshReviewSession(setId);
            currentBrowsingSetId = setId;

            // Khôi phục danh sách thẻ theo đúng thứ tự đã lưu (bỏ qua thẻ đã bị xóa)
            const cardMap = {};
            set.cards.forEach(c => cardMap[c.id] = c);
            const restoredCards = saved.cardOrder.map(id => cardMap[id]).filter(Boolean);

            if (restoredCards.length === 0) return startFreshReviewSession(setId);

            const { options } = buildReviewTypesForCards(restoredCards); // tái tạo phương án nhiễu (không ảnh hưởng đáp án đúng)
            studySession.cards = restoredCards;
            studySession.reviewCardOrder = saved.cardOrder;
            studySession.reviewTypes = saved.types.slice(0, restoredCards.length);
            studySession.reviewOptions = restoredCards.map((c, i) => studySession.reviewTypes[i] === 'mc' ? options[i] : null);
            studySession.currentIndex = Math.min(saved.currentIndex, restoredCards.length - 1);
            studySession.reviewCorrectCount = saved.correctCount || 0;
            studySession.reviewBatchCorrect = saved.batchCorrect || 0;
            studySession.reviewAnswered = false;
            studySession.reviewLastCorrect = false;
            studySession.reviewSelectedAnswer = null;

            switchPage('session-review');
        }

        function handleReviewMCAnswer(optionIndex) {
            if (studySession.reviewAnswered) return;
            const idx = studySession.currentIndex;
            const card = studySession.cards[idx];
            const options = studySession.reviewOptions[idx];
            const selected = options[optionIndex];

            studySession.reviewSelectedAnswer = selected;
            studySession.reviewLastCorrect = (selected === card.term);
            registerReviewAnswer(studySession.reviewLastCorrect);
        }

        function checkReviewTypingAnswer() {
            if (studySession.reviewAnswered) return;
            const input = document.getElementById('review-typing-input');
            if (!input) return;
            const idx = studySession.currentIndex;
            const card = studySession.cards[idx];
            const userAns = input.value.trim().toLowerCase();
            const correct = userAns === card.term.trim().toLowerCase() && userAns !== '';

            studySession.reviewSelectedAnswer = input.value;
            studySession.reviewLastCorrect = correct;
            registerReviewAnswer(correct);
        }

        function revealReviewAnswer() {
            if (studySession.reviewAnswered) return;
            studySession.reviewSelectedAnswer = null;
            studySession.reviewLastCorrect = false;
            registerReviewAnswer(false);
        }

        function registerReviewAnswer(isCorrect) {
            studySession.reviewAnswered = true;
            recordActivity(1);
            if (isCorrect) {
                studySession.reviewCorrectCount++;
                studySession.reviewBatchCorrect++;
                showToast('Chính xác!', 'check');
            } else {
                showToast('Chưa đúng, xem đáp án nhé!', 'x-circle');
            }
            saveReviewProgress();
            switchPage('session-review');
        }

        function continueReviewAfterFeedback() {
            const total = studySession.cards.length;
            const nextIndex = studySession.currentIndex + 1;
            const isCheckpoint = nextIndex % 10 === 0 && nextIndex < total;
            const isFinished = nextIndex >= total;

            studySession.currentIndex = nextIndex;
            studySession.reviewAnswered = false;
            studySession.reviewSelectedAnswer = null;

            if (isFinished) {
                clearReviewProgress(currentBrowsingSetId);
                const pct = Math.round((studySession.reviewCorrectCount / total) * 100);
                showResultModal('award', 'Hoàn thành phiên ôn tập!', `Bạn đã trả lời đúng ${studySession.reviewCorrectCount}/${total} câu (${pct}% chính xác).`, [
                    { label: 'Ôn tập lại', action: `startFreshReviewSession('${currentBrowsingSetId}')` },
                    { label: 'Quay về học phần', action: `switchPage('study-hub', '${currentBrowsingSetId}')`, primary: true }
                ]);
                return;
            }

            saveReviewProgress();

            if (isCheckpoint) {
                const batch = studySession.reviewBatchCorrect;
                studySession.reviewBatchCorrect = 0;
                showResultModal('bar-chart-3', `Đã hoàn thành ${nextIndex} câu!`, `Trong 10 câu vừa qua, bạn trả lời đúng ${batch}/10 câu. Tiếp tục cố lên nhé!`, [
                    { label: 'Tiếp tục ôn tập', action: `switchPage('session-review')`, primary: true }
                ]);
            } else {
                switchPage('session-review');
            }
        }

        // CHỨC NĂNG CORE: LẬT THẺ FLASHCARD
        function flipFlashcard() {
            const innerCard = document.getElementById('flashcard-inner');
            if (innerCard) innerCard.classList.toggle('rotate-y-180');
        }

        // THUẬT TOÁN SPACED REPETITION (SUPERMEMO SM-2 SIMPLIFIED)
        function handleSpacedRepetitionScore(score) {
            const set = studySets.find(s => s.id === currentBrowsingSetId);
            const activeCardInSession = studySession.cards[studySession.currentIndex];
            const realCard = set.cards.find(c => c.id === activeCardInSession.id);

            if (realCard) {
                // Tính toán cấu trúc ngày lặp tiếp theo dựa trên chất lượng phản hồi điểm số
                if (score < 2) {
                    realCard.interval = 1;
                } else {
                    if (realCard.interval === 1) realCard.interval = 3;
                    else if (realCard.interval === 3) realCard.interval = 6;
                    else realCard.interval = Math.round(realCard.interval * (realCard.easeFactor || 2.5));
                }

                // Cập nhật hệ số dễ/khó (Ease Factor)
                realCard.easeFactor = (realCard.easeFactor || 2.5) + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
                if (realCard.easeFactor < 1.3) realCard.easeFactor = 1.3;

                // Gán mốc thời gian thực ôn tiếp theo
                realCard.nextReview = Date.now() + (realCard.interval * 86400000);

                // Tăng nhẹ % tiến độ học phần ngẫu nhiên cho sinh động trực quan
                set.progress = Math.min(set.progress + Math.round(100 / set.cards.length), 100);
                saveToStorage();
                recordActivity(1);
            }

            // Tiến tới thẻ tiếp theo
            if (studySession.currentIndex + 1 < studySession.cards.length) {
                studySession.currentIndex++;
                switchPage('session-flashcards');
            } else {
                showResultModal('award', 'Hoàn thành phiên Flashcards!', 'Bạn đã ôn tập xong toàn bộ thuật ngữ và lịch Spaced Repetition đã được cập nhật.', [
                    { label: 'Học lại từ đầu', action: `startStudySession('flashcards')` },
                    { label: 'Quay về học phần', action: `switchPage('study-hub', '${currentBrowsingSetId}')`, primary: true }
                ]);
            }
        }

        // CHỨC NĂNG CORE: KIỂM TRA ĐÁP ÁN GÕ PHÍM (LEARN CHẾ ĐỘ)
        function checkLearnAnswer() {
            const input = document.getElementById('learn-input');
            const feedback = document.getElementById('learn-feedback');
            if (!input) return;
            const userAns = input.value.trim().toLowerCase();
            const correctAns = studySession.cards[studySession.currentIndex].term.trim().toLowerCase();
            recordActivity(1);

            if (userAns === correctAns) {
                studySession.correctInLearn++;
                if (feedback) feedback.innerHTML = `<span class="text-brand-500">Chính xác tuyệt đối!</span>`;
                showToast("Chính xác tuyệt đối!", "check");
                advanceLearnSession();
            } else {
                if (feedback) feedback.innerHTML = `<span class="text-rose-500">Chưa đúng. Đáp án chuẩn: <strong>${escapeHtml(studySession.cards[studySession.currentIndex].term)}</strong></span>`;
                showToast(`Chưa đúng rồi! Đáp án chuẩn: ${studySession.cards[studySession.currentIndex].term}`, "x-circle");
                input.select();
            }
        }

        function skipLearnCard() {
            advanceLearnSession();
        }

        function advanceLearnSession() {
            if (studySession.currentIndex + 1 < studySession.cards.length) {
                studySession.currentIndex++;
                switchPage('session-learn');
            } else {
                const total = studySession.cards.length;
                const pct = Math.round((studySession.correctInLearn / total) * 100);
                showResultModal('trophy', 'Hoàn thành chế độ tự luận!', `Bạn đã trả lời đúng ${studySession.correctInLearn}/${total} thuật ngữ (${pct}% chính xác).`, [
                    { label: 'Học lại từ đầu', action: `startStudySession('learn')` },
                    { label: 'Quay về học phần', action: `switchPage('study-hub', '${currentBrowsingSetId}')`, primary: true }
                ]);
            }
        }

        // CẬP NHẬT THANH TIẾN ĐỘ BÀI THI THEO THỜI GIAN THỰC
        function updateTestProgress() {
            const total = studySession.cards.length;
            const answered = studySession.cards.filter(c => {
                const val = studySession.testAnswers[c.id];
                return val && String(val).trim() !== '';
            }).length;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            const fill = document.getElementById('test-progress-fill');
            const label = document.getElementById('test-progress-label');
            if (fill) fill.style.width = pct + '%';
            if (label) label.innerText = `${answered} / ${total} câu`;
        }

        // CHỨC NĂNG CORE: NỘP BÀI THI THỬ & CHẤM ĐIỂM
        function submitTestSession() {
            const unanswered = studySession.cards.filter(c => {
                const val = studySession.testAnswers[c.id];
                return !val || String(val).trim() === '';
            }).length;
            if (unanswered > 0) {
                showToast(`Bạn còn ${unanswered} câu chưa trả lời!`, 'alert-triangle');
                return;
            }

            let correctCount = 0;
            studySession.cards.forEach(card => {
                const qType = studySession.testTypes[card.id] || 'mc';
                const answer = studySession.testAnswers[card.id] || '';
                if (qType === 'typing') {
                    if (answer.trim().toLowerCase() === card.term.trim().toLowerCase()) correctCount++;
                } else {
                    if (answer === card.definition) correctCount++;
                }
            });
            const scorePct = Math.round((correctCount / studySession.cards.length) * 100);
            recordActivity(studySession.cards.length);
            const icon = scorePct >= 80 ? 'award' : (scorePct >= 50 ? 'thumbs-up' : 'refresh-ccw');
            showResultModal(icon, 'Kết quả bài thi thử', `Số câu đúng: ${correctCount}/${studySession.cards.length} — Đạt tỷ lệ ${scorePct}% chính xác.`, [
                { label: 'Làm lại bài thi', action: `startStudySession('test')` },
                { label: 'Quay về học phần', action: `switchPage('study-hub', '${currentBrowsingSetId}')`, primary: true }
            ]);
        }

        // CHỨC NĂNG CORE: GAME GHÉP THẺ SPEED MATCH
        let matchIntervalTimer = null;
        function startMatchTimer() {
            const startTime = Date.now();
            if (matchIntervalTimer) clearInterval(matchIntervalTimer);
            matchIntervalTimer = setInterval(() => {
                const el = document.getElementById('match-timer');
                if (!el) { clearInterval(matchIntervalTimer); return; }
                el.innerText = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
            }, 100);
        }

        function renderMatchGrid() {
            const grid = document.getElementById('match-grid-container');
            if (!grid) return;
            grid.innerHTML = studySession.matchCards.map((card, index) => `
                <div id="match-item-${index}" onclick="handleMatchSelection(${index})" class="h-28 bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl shadow-sm flex items-center justify-center text-center font-semibold text-xs sm:text-sm cursor-pointer hover:border-brand-500 transition-all select-none">
                    ${escapeHtml(card.text)}
                </div>
            `).join('');
        }

        function handleMatchSelection(index) {
            const selectedCard = studySession.matchCards[index];
            if (!selectedCard || selectedCard.cleared) return;

            const element = document.getElementById(`match-item-${index}`);

            if (studySession.selectedMatchId === null) {
                // Lựa chọn ô thứ nhất
                studySession.selectedMatchId = index;
                element.className = "h-28 bg-brand-50 dark:bg-brand-500/10 border-2 border-brand-500 p-4 rounded-xl shadow-sm flex items-center justify-center text-center font-bold text-xs sm:text-sm cursor-pointer select-none text-brand-500";
            } else {
                // Lựa chọn ô thứ hai để đối chiếu ghép cặp
                const prevIndex = studySession.selectedMatchId;
                if (prevIndex === index) { studySession.selectedMatchId = null; return; }

                const prevCard = studySession.matchCards[prevIndex];
                const prevElement = document.getElementById(`match-item-${prevIndex}`);

                if (prevCard.id === selectedCard.id && prevCard.type !== selectedCard.type) {
                    // GHÉP ĐÚNG CẶP
                    prevCard.cleared = true;
                    selectedCard.cleared = true;
                    prevElement.style.visibility = 'hidden';
                    element.style.visibility = 'hidden';
                    showToast("Đã khớp một cặp!", "sparkles");
                    recordActivity(1);

                    // Kiểm tra hoàn thành game hoàn toàn chưa
                    if (studySession.matchCards.every(c => c.cleared)) {
                        clearInterval(matchIntervalTimer);
                        const finalTime = document.getElementById('match-timer').innerText;
                        showResultModal('sparkles', 'Đã dọn sạch bảng ghép thẻ!', `Kỷ lục thời gian của bạn là ${finalTime}. Thử thách lại để phá kỷ lục nhé!`, [
                            { label: 'Chơi lại', action: `startStudySession('match')` },
                            { label: 'Quay về học phần', action: `switchPage('study-hub', '${currentBrowsingSetId}')`, primary: true }
                        ]);
                    }
                } else {
                    // GHÉP SAI CẶP -> Khôi phục giao diện nguyên trạng ban đầu
                    showToast("Không khớp rồi, thử lại nhé!", "info");
                    prevElement.className = "h-28 bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl shadow-sm flex items-center justify-center text-center font-semibold text-xs sm:text-sm cursor-pointer hover:border-brand-500 transition-all select-none";
                    element.className = "h-28 bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-400 p-4 rounded-xl shadow-sm flex items-center justify-center text-center font-semibold text-xs sm:text-sm cursor-pointer select-none text-rose-500 transition-all";
                    setTimeout(() => {
                        if (element) element.className = "h-28 bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl shadow-sm flex items-center justify-center text-center font-semibold text-xs sm:text-sm cursor-pointer hover:border-brand-500 transition-all select-none";
                    }, 400);
                }
                studySession.selectedMatchId = null;
            }
        }

        // TÌM KIẾM TOÀN CỤC REAL-TIME
        function handleGlobalSearch(query) {
            query = query.trim().toLowerCase();
            if (currentActivePage !== 'dashboard' && currentActivePage !== 'library') return;

            const filteredSets = studySets.filter(s => s.title.toLowerCase().includes(query) || s.category.toLowerCase().includes(query));
            const containerList = document.getElementById('dashboard-sets-list');

            if (currentActivePage === 'dashboard' && containerList) {
                if (filteredSets.length === 0) {
                    containerList.innerHTML = `<div class="col-span-full py-6 text-sm text-slate-400 text-center">Không khớp bộ thẻ nào.</div>`;
                    return;
                }
                containerList.innerHTML = filteredSets.map(set => `
                <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm hover:border-brand-500/40 transition-all cursor-pointer group flex flex-col justify-between h-40" onclick="openStudySet('${set.id}')">
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md">${escapeHtml(set.category)}</span>
                        </div>
                        <h4 class="font-bold text-base group-hover:text-brand-500 transition-colors line-clamp-1">${escapeHtml(set.title)}</h4>
                        <p class="text-xs text-slate-400 mt-1 line-clamp-1">${escapeHtml(set.description || '')}</p>
                    </div>
                    <div class="space-y-1.5">
                        <div class="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-brand-500 h-full rounded-full" style="width: ${set.progress}%"></div>
                        </div>
                    </div>
                </div>`).join('');
                safeLucide();
            }
        }

        // CHẾ ĐỘ SÁNG / CHẾ ĐỘ TỐI DARK MODE CHUẨN XÁC
        function toggleDarkMode() {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('ruanho_theme', 'light');
                showToast("Đã chuyển sang Chế độ sáng!", "sun");
            } else {
                html.classList.add('dark');
                localStorage.setItem('ruanho_theme', 'dark');
                showToast("Đã chuyển sang Chế độ tối đẳng cấp!", "moon");
            }
        }

        // THÔNG BÁO TOAST DYNAMIC DỄ DÀNG CHẠY
        function showToast(message, iconName = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = "flex items-center gap-3 bg-slate-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 translate-x-10 opacity-0 pointer-events-auto page-fade";
            toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i> <span>${escapeHtml(message)}</span>`;
            container.appendChild(toast);
            safeLucide();

            setTimeout(() => { toast.classList.remove('translate-x-10', 'opacity-0'); }, 10);
            setTimeout(() => {
                toast.classList.add('translate-x-10', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // MODAL KẾT QUẢ ĐẸP MẮT THAY THẾ ALERT() MẶC ĐỊNH CỦA TRÌNH DUYỆT
        function showResultModal(iconName, title, message, buttons) {
            const container = document.getElementById('modal-container');
            if (!container) return;
            const buttonsHtml = buttons.map(b => `
                <button onclick="closeResultModal(); ${b.action}" class="${b.primary ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'} flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95">${escapeHtml(b.label)}</button>
            `).join('');

            container.innerHTML = `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm modal-backdrop" onclick="if(event.target === this) closeResultModal()">
                <div class="modal-panel bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center space-y-4">
                    <div class="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center">
                        <i data-lucide="${iconName}" class="w-8 h-8"></i>
                    </div>
                    <div class="space-y-1.5">
                        <h3 class="text-lg font-bold text-slate-900 dark:text-zinc-100">${escapeHtml(title)}</h3>
                        <p class="text-sm text-slate-500 dark:text-zinc-400">${escapeHtml(message)}</p>
                    </div>
                    <div class="flex gap-2 pt-2">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>`;
            safeLucide();
        }

        function closeResultModal() {
            const container = document.getElementById('modal-container');
            if (container) container.innerHTML = '';
        }

        // KHÔI PHỤC DỮ LIỆU CÀI ĐẶT GỐC
        function resetAllDataData() {
            if (confirm("Xác nhận xóa hết dữ liệu cá nhân của bạn trên ứng dụng?")) {
                localStorage.removeItem('ruanho_sets');
                localStorage.removeItem('ruanho_activity');
                localStorage.removeItem('ruanho_calendar_events');
                dailyActivity = {};
                studySets = defaultStudySets;
                calendarEvents = [];
                saveToStorage();
                saveCalendarEvents();
                updateStreakDisplay();
                showToast("Đã reset dữ liệu.", "refresh-cw");
                switchPage('dashboard');
            }
        }

        // Hàm tiện ích Escape bảo vệ chuỗi HTML chống lỗi vỡ giao diện cú pháp dữ liệu lạ
        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        // TỰ ĐỘNG CHẠY BAN ĐẦU KHI TẢI TRANG
        document.addEventListener("DOMContentLoaded", () => {
            initAuth();
        });
