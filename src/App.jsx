import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Money from './pages/Money';

const dictionaries = {
  en: {
    appName: 'Life OS',
    navDev: 'Development',
    navFin: 'Finances',
    logout: 'Log out',
    theme: 'Theme',
    language: 'Language',
    authWelcome: 'Welcome back',
    authCreate: 'Create an account',
    authWelcomeText: 'Enter your details to open your dashboard.',
    authCreateText: 'Start organizing your life with a premium personal OS.',
    authName: 'Full name',
    authNamePh: 'e.g. Jane Doe',
    authPassword: 'Password',
    authLoading: 'Loading...',
    authLogin: 'Log in',
    authSignup: 'Sign up',
    authSwitchLogin: 'Already have an account? Log in',
    authSwitchSignup: 'No account? Sign up free',
    authSignupSuccess: 'Account created. Check your email for verification, then log in.',
    authSignupError: 'Signup error: ',
    authLoginError: 'Login error: ',
    addPh: 'Activity name...',
    addBtn: 'Add',
    masterTitle: 'Development Pulse',
    masterDesc: 'Consistency over the last 14 days.',
    delete: 'Delete',
    valPh: 'Metric value, optional',
    notePh: 'Journal notes...',
    saveBtn: 'Save',
    today: 'Today',
    back: 'Back',
    activityFeed: 'Activity feed',
    noLogs: 'No logs yet.',
    affiliateTitle: 'Relevant pick',
    affiliateBody: 'Static placeholder for contextual affiliate content.',
    sponsoredBy: 'Sponsored by Northstar Labs',
    titleJob: 'Jobs & Timesheets',
    newJob: 'New job name...',
    addJob: 'Add job',
    shiftTitle: 'Income tracking',
    shiftDate: 'Date',
    shiftJob: 'Job',
    shiftHours: 'Hours',
    shiftRate: 'Hourly rate',
    shiftTips: 'Tips / bonuses',
    addShift: 'Log shift',
    expTitle: 'Outflow calendar',
    expDate: 'Date',
    expAmount: 'Amount',
    expDescription: 'Description',
    addExp: 'Add expense',
    balTitle: '6-Month Balance',
    inc: 'Income',
    exp: 'Expenses',
    noJobs: 'Add a job before logging income.',
    b2bFlag: 'Future B2B white-label team tier extension point.',
  },
  ro: {
    appName: 'Life OS',
    navDev: 'Dezvoltare',
    navFin: 'Finanțe',
    logout: 'Ieșire',
    theme: 'Temă',
    language: 'Limbă',
    authWelcome: 'Bine ai revenit',
    authCreate: 'Creează un cont',
    authWelcomeText: 'Introdu datele pentru a accesa dashboard-ul.',
    authCreateText: 'Începe să îți organizezi viața ca un OS personal premium.',
    authName: 'Nume complet',
    authNamePh: 'ex: Numele tău complet',
    authPassword: 'Parolă',
    authLoading: 'Se încarcă...',
    authLogin: 'Conectare',
    authSignup: 'Înregistrare',
    authSwitchLogin: 'Ai deja un cont? Conectează-te',
    authSwitchSignup: 'Nu ai cont? Înregistrează-te gratuit',
    authSignupSuccess: 'Cont creat. Verifică emailul, apoi conectează-te.',
    authSignupError: 'Eroare la înregistrare: ',
    authLoginError: 'Eroare la logare: ',
    addPh: 'Nume activitate...',
    addBtn: 'Adaugă',
    masterTitle: 'Pulsul Dezvoltării',
    masterDesc: 'Consistența pe ultimele 14 zile.',
    delete: 'Șterge',
    valPh: 'Valoare metrică, opțional',
    notePh: 'Observații în jurnal...',
    saveBtn: 'Salvează',
    today: 'Azi',
    back: 'Înapoi',
    activityFeed: 'Timeline activitate',
    noLogs: 'Nu există loguri încă.',
    affiliateTitle: 'Recomandare relevantă',
    affiliateBody: 'Placeholder static pentru conținut afiliat contextual.',
    sponsoredBy: 'Sponsored by Northstar Labs',
    titleJob: 'Joburi & Pontaj',
    newJob: 'Nume job nou...',
    addJob: 'Adaugă job',
    shiftTitle: 'Urmărire venit',
    shiftDate: 'Dată',
    shiftJob: 'Job',
    shiftHours: 'Ore',
    shiftRate: 'Rată orară',
    shiftTips: 'Tips / bonusuri',
    addShift: 'Loghează tura',
    expTitle: 'Calendar ieșiri',
    expDate: 'Dată',
    expAmount: 'Sumă',
    expDescription: 'Descriere',
    addExp: 'Adaugă cheltuială',
    balTitle: 'Balanță Ultimele 6 Luni',
    inc: 'Venituri',
    exp: 'Cheltuieli',
    noJobs: 'Adaugă un job înainte să loghezi venit.',
    b2bFlag: 'Punct de extensie viitor pentru tier B2B white-label.',
  },
  fr: {
    appName: 'Life OS',
    navDev: 'Développement',
    navFin: 'Finances',
    logout: 'Quitter',
    theme: 'Thème',
    language: 'Langue',
    authWelcome: 'Bon retour',
    authCreate: 'Créer un compte',
    authWelcomeText: 'Saisissez vos informations pour ouvrir le tableau de bord.',
    authCreateText: 'Commencez à organiser votre vie avec un OS personnel premium.',
    authName: 'Nom complet',
    authNamePh: 'ex: Votre nom complet',
    authPassword: 'Mot de passe',
    authLoading: 'Chargement...',
    authLogin: 'Connexion',
    authSignup: 'Inscription',
    authSwitchLogin: 'Vous avez déjà un compte ? Connectez-vous',
    authSwitchSignup: 'Pas de compte ? Inscription gratuite',
    authSignupSuccess: 'Compte créé. Vérifiez votre email, puis connectez-vous.',
    authSignupError: "Erreur d'inscription : ",
    authLoginError: 'Erreur de connexion : ',
    addPh: "Nom de l'activité...",
    addBtn: 'Ajouter',
    masterTitle: 'Pouls du Développement',
    masterDesc: 'Cohérence sur les 14 derniers jours.',
    delete: 'Supprimer',
    valPh: 'Valeur métrique, optionnelle',
    notePh: 'Notes de journal...',
    saveBtn: 'Enregistrer',
    today: "Aujourd'hui",
    back: 'Retour',
    activityFeed: "Fil d'activité",
    noLogs: 'Aucun log pour le moment.',
    affiliateTitle: 'Suggestion pertinente',
    affiliateBody: "Placeholder statique pour contenu d'affiliation contextuel.",
    sponsoredBy: 'Sponsored by Northstar Labs',
    titleJob: 'Emplois & Horaires',
    newJob: 'Nouveau travail...',
    addJob: 'Ajouter',
    shiftTitle: 'Suivi des revenus',
    shiftDate: 'Date',
    shiftJob: 'Emploi',
    shiftHours: 'Heures',
    shiftRate: 'Taux horaire',
    shiftTips: 'Pourboires / bonus',
    addShift: 'Ajouter service',
    expTitle: 'Calendrier des sorties',
    expDate: 'Date',
    expAmount: 'Montant',
    expDescription: 'Description',
    addExp: 'Ajouter dépense',
    balTitle: 'Bilan sur 6 Mois',
    inc: 'Revenus',
    exp: 'Dépenses',
    noJobs: "Ajoutez un emploi avant d'enregistrer un revenu.",
    b2bFlag: "Point d'extension futur pour une offre équipe B2B white-label.",
  },
  es: {
    appName: 'Life OS',
    navDev: 'Desarrollo',
    navFin: 'Finanzas',
    logout: 'Salir',
    theme: 'Tema',
    language: 'Idioma',
    authWelcome: 'Bienvenido',
    authCreate: 'Crear cuenta',
    authWelcomeText: 'Ingresa tus datos para abrir el panel.',
    authCreateText: 'Empieza a organizar tu vida con un OS personal premium.',
    authName: 'Nombre completo',
    authNamePh: 'ej: Tu nombre completo',
    authPassword: 'Contraseña',
    authLoading: 'Cargando...',
    authLogin: 'Entrar',
    authSignup: 'Registrarse',
    authSwitchLogin: '¿Ya tienes cuenta? Entra',
    authSwitchSignup: '¿Sin cuenta? Regístrate gratis',
    authSignupSuccess: 'Cuenta creada. Revisa tu email y luego entra.',
    authSignupError: 'Error de registro: ',
    authLoginError: 'Error de acceso: ',
    addPh: 'Nombre de actividad...',
    addBtn: 'Añadir',
    masterTitle: 'Pulso de Desarrollo',
    masterDesc: 'Consistencia en los últimos 14 días.',
    delete: 'Borrar',
    valPh: 'Valor métrico, opcional',
    notePh: 'Notas de diario...',
    saveBtn: 'Guardar',
    today: 'Hoy',
    back: 'Atrás',
    activityFeed: 'Feed de actividad',
    noLogs: 'Aún no hay registros.',
    affiliateTitle: 'Selección relevante',
    affiliateBody: 'Placeholder estático para contenido afiliado contextual.',
    sponsoredBy: 'Sponsored by Northstar Labs',
    titleJob: 'Trabajos & Horarios',
    newJob: 'Nuevo trabajo...',
    addJob: 'Añadir trabajo',
    shiftTitle: 'Seguimiento de ingresos',
    shiftDate: 'Fecha',
    shiftJob: 'Trabajo',
    shiftHours: 'Horas',
    shiftRate: 'Tarifa por hora',
    shiftTips: 'Propinas / bonos',
    addShift: 'Registrar turno',
    expTitle: 'Calendario de gastos',
    expDate: 'Fecha',
    expAmount: 'Importe',
    expDescription: 'Descripción',
    addExp: 'Añadir gasto',
    balTitle: 'Balance de 6 Meses',
    inc: 'Ingresos',
    exp: 'Gastos',
    noJobs: 'Añade un trabajo antes de registrar ingresos.',
    b2bFlag: 'Punto de extensión futuro para tier B2B white-label.',
  },
  de: {
    appName: 'Life OS',
    navDev: 'Entwicklung',
    navFin: 'Finanzen',
    logout: 'Abmelden',
    theme: 'Thema',
    language: 'Sprache',
    authWelcome: 'Willkommen zurück',
    authCreate: 'Konto erstellen',
    authWelcomeText: 'Gib deine Daten ein, um das Dashboard zu öffnen.',
    authCreateText: 'Organisiere dein Leben mit einem Premium Personal OS.',
    authName: 'Vollständiger Name',
    authNamePh: 'z.B. Vollständiger Name',
    authPassword: 'Passwort',
    authLoading: 'Lädt...',
    authLogin: 'Einloggen',
    authSignup: 'Registrieren',
    authSwitchLogin: 'Schon ein Konto? Einloggen',
    authSwitchSignup: 'Kein Konto? Kostenlos registrieren',
    authSignupSuccess: 'Konto erstellt. Prüfe deine E-Mail und logge dich ein.',
    authSignupError: 'Registrierungsfehler: ',
    authLoginError: 'Loginfehler: ',
    addPh: 'Aktivitätsname...',
    addBtn: 'Hinzufügen',
    masterTitle: 'Entwicklungspuls',
    masterDesc: 'Konsistenz der letzten 14 Tage.',
    delete: 'Löschen',
    valPh: 'Messwert, optional',
    notePh: 'Journalnotizen...',
    saveBtn: 'Speichern',
    today: 'Heute',
    back: 'Zurück',
    activityFeed: 'Aktivitätsfeed',
    noLogs: 'Noch keine Logs.',
    affiliateTitle: 'Relevante Auswahl',
    affiliateBody: 'Statischer Platzhalter für kontextuelle Affiliate-Inhalte.',
    sponsoredBy: 'Sponsored by Northstar Labs',
    titleJob: 'Jobs & Zeiten',
    newJob: 'Neuer Job...',
    addJob: 'Job hinzufügen',
    shiftTitle: 'Einkommen erfassen',
    shiftDate: 'Datum',
    shiftJob: 'Job',
    shiftHours: 'Stunden',
    shiftRate: 'Stundensatz',
    shiftTips: 'Trinkgeld / Boni',
    addShift: 'Schicht loggen',
    expTitle: 'Ausgabenkalender',
    expDate: 'Datum',
    expAmount: 'Betrag',
    expDescription: 'Beschreibung',
    addExp: 'Ausgabe hinzufügen',
    balTitle: '6-Monats-Bilanz',
    inc: 'Einnahmen',
    exp: 'Ausgaben',
    noJobs: 'Füge einen Job hinzu, bevor du Einkommen loggst.',
    b2bFlag: 'Zukünftiger Erweiterungspunkt für B2B White-Label Team Tier.',
  },
  zh: {
    appName: 'Life OS',
    navDev: '发展',
    navFin: '财务',
    logout: '退出',
    theme: '主题',
    language: '语言',
    authWelcome: '欢迎回来',
    authCreate: '创建账户',
    authWelcomeText: '输入信息以打开仪表盘。',
    authCreateText: '用高级个人 OS 开始管理生活。',
    authName: '全名',
    authNamePh: '例: 你的全名',
    authPassword: '密码',
    authLoading: '加载中...',
    authLogin: '登录',
    authSignup: '注册',
    authSwitchLogin: '已有账户？登录',
    authSwitchSignup: '没有账户？免费注册',
    authSignupSuccess: '账户已创建。请验证邮箱后登录。',
    authSignupError: '注册错误: ',
    authLoginError: '登录错误: ',
    addPh: '活动名称...',
    addBtn: '添加',
    masterTitle: '发展脉搏',
    masterDesc: '最近 14 天的一致性。',
    delete: '删除',
    valPh: '指标值，可选',
    notePh: '日志备注...',
    saveBtn: '保存',
    today: '今天',
    back: '返回',
    activityFeed: '活动动态',
    noLogs: '暂无记录。',
    affiliateTitle: '相关推荐',
    affiliateBody: '用于上下文联盟内容的静态占位。',
    sponsoredBy: 'Sponsored by Northstar Labs',
    titleJob: '工作与工时',
    newJob: '新工作名称...',
    addJob: '添加工作',
    shiftTitle: '收入跟踪',
    shiftDate: '日期',
    shiftJob: '工作',
    shiftHours: '小时',
    shiftRate: '时薪',
    shiftTips: '小费 / 奖金',
    addShift: '记录班次',
    expTitle: '支出日历',
    expDate: '日期',
    expAmount: '金额',
    expDescription: '描述',
    addExp: '添加支出',
    balTitle: '6 个月余额',
    inc: '收入',
    exp: '支出',
    noJobs: '请先添加工作再记录收入。',
    b2bFlag: '未来 B2B white-label 团队层级扩展点。',
  },
};

const languages = [
  ['en', 'EN'],
  ['ro', 'RO'],
  ['fr', 'FR'],
  ['es', 'ES'],
  ['de', 'DE'],
  ['zh', 'ZH'],
];

export default function App() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('money');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const t = useMemo(() => dictionaries[lang] || dictionaries.en, [lang]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLangChange = (event) => {
    const nextLang = event.target.value;
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (initializing) return null;

  if (!session) {
    return (
      <Auth
        t={t}
        lang={lang}
        theme={theme}
        languages={languages}
        onLangChange={handleLangChange}
        onThemeToggle={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased transition-colors duration-200 dark:bg-[#0A0A0A] dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#0A0A0A]/80 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {activeTab === 'dashboard' ? t.navDev : t.navFin}
            </h1>
            <span className="block text-xs font-medium text-zinc-500">{t.appName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <select
              aria-label={t.language}
              value={lang}
              onChange={handleLangChange}
              className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm font-medium text-zinc-500 outline-none transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-zinc-100"
            >
              {languages.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label={t.theme}
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-zinc-100"
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-zinc-100 sm:block"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <nav className="mx-auto flex max-w-5xl justify-center px-4 pt-4 sm:px-6">
        <div className="flex max-w-full gap-1 rounded-full border border-zinc-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-lg dark:border-zinc-800 dark:bg-[#111111]/90">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors sm:px-6 ${
              activeTab === 'dashboard'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {t.navDev}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('money')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors sm:px-6 ${
              activeTab === 'money'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {t.navFin}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl p-4 pb-10 pt-4 sm:p-6">
        {/* Future extension point: B2B white-label team tier. Keep disabled until explicitly scoped. */}
        {activeTab === 'dashboard' ? (
          <Dashboard t={t} lang={lang} theme={theme} user={session.user} />
        ) : (
          <Money t={t} lang={lang} theme={theme} user={session.user} />
        )}
      </main>
    </div>
  );
}
