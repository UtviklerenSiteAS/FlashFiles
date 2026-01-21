export const translations = {
    no: {
        // Common
        loading: 'Laster...',

        // Landing Page
        landing: {
            title: 'Send filer fra mobil til PC',
            subtitle: 'på sekunder',
            description: 'FlashFiles lar deg overføre bilder, videoer og dokumenter fra telefonen til datamaskinen – uten kabler, uten apper, uten stress.',
            getStarted: 'Kom i gang gratis',
            login: 'Logg inn',
            features: {
                instant: 'Lynrask overføring',
                secure: 'Sikker & privat',
                noApp: 'Ingen app nødvendig'
            }
        },

        // Auth
        auth: {
            email: 'E-post',
            password: 'Passord',
            login: 'Logg inn',
            register: 'Registrer deg',
            createAccount: 'Opprett konto',
            alreadyHaveAccount: 'Har du allerede en konto?',
            noAccount: 'Har du ikke en konto?',
            forgotPassword: 'Glemt passord?',
            or: 'eller',
            continueWithGoogle: 'Fortsett med Google',
            signingIn: 'Logger inn...',
            creatingAccount: 'Oppretter konto...'
        },

        // Dashboard
        dashboard: {
            allFiles: 'Alle filer',
            images: 'Bilder',
            videos: 'Videoer',
            documents: 'Dokumenter',
            noFiles: 'Ingen filer funnet i denne kategorien.',
            fileReceived: 'Ny fil mottatt',
            accept: 'Motta',
            decline: 'Avvis',
            download: 'Last ned',
            logout: 'Logg ut',
            autoReceive: 'Motta filer automatisk',
            settings: 'Innstillinger',
            language: 'Språk',
            filesAppear: 'Her dukker filer opp automatisk når du sender fra mobilen.',
            today: 'I dag',
            yesterday: 'I går'
        }
    },

    en: {
        // Common
        loading: 'Loading...',

        // Landing Page
        landing: {
            title: 'Send files from mobile to PC',
            subtitle: 'in seconds',
            description: 'FlashFiles lets you transfer photos, videos and documents from your phone to your computer – no cables, no apps, no hassle.',
            getStarted: 'Get started free',
            login: 'Log in',
            features: {
                instant: 'Lightning fast transfer',
                secure: 'Secure & private',
                noApp: 'No app required'
            }
        },

        // Auth
        auth: {
            email: 'Email',
            password: 'Password',
            login: 'Log in',
            register: 'Sign up',
            createAccount: 'Create account',
            alreadyHaveAccount: 'Already have an account?',
            noAccount: "Don't have an account?",
            forgotPassword: 'Forgot password?',
            or: 'or',
            continueWithGoogle: 'Continue with Google',
            signingIn: 'Signing in...',
            creatingAccount: 'Creating account...'
        },

        // Dashboard
        dashboard: {
            allFiles: 'All Files',
            images: 'Images',
            videos: 'Videos',
            documents: 'Documents',
            noFiles: 'No files found in this category.',
            fileReceived: 'New file received',
            accept: 'Accept',
            decline: 'Decline',
            download: 'Download',
            logout: 'Log out',
            autoReceive: 'Auto-receive files',
            settings: 'Settings',
            language: 'Language',
            filesAppear: 'Files will appear here automatically when you send from your phone.',
            today: 'Today',
            yesterday: 'Yesterday'
        }
    }
};

export type Language = 'no' | 'en';
export type Translations = typeof translations.no;
