export const translations = {
    no: {
        // Common
        loading: 'Laster...',

        // Home Screen
        home: {
            uploadTitle: 'Last opp fil eller bilde',
            uploadSubtitle: 'Maksimal filstørrelse: 10MB',
            uploadsSection: 'Opplastinger',
            noUploads: 'Ingen aktive opplastinger',
            noUploadsHint: 'Last opp en fil for å komme i gang',
            sending: 'Sender...',
            sent: 'Sendt! 🚀',
            failed: 'Feilet',
            preparing: 'Klargjør fil...',
        },

        // Upload Modal
        upload: {
            chooseType: 'Velg type',
            photoVideo: 'Bilde / Video',
            fileDocument: 'Fil / Dokument',
            cancel: 'Avbryt',
            swipeToSend: 'Sveip opp for å sende',
            addTextOverlay: 'Legg til tekst',
            title: 'Tittel',
            description: 'Beskrivelse',
        },

        // Settings
        settings: {
            title: 'Innstillinger',
            subtitle: 'Administrer konto og preferanser',
            account: 'Konto',
            userAccount: 'Brukerkonto',
            proMember: 'Pro-medlem',
            application: 'Applikasjon',
            notifications: 'Varsler',
            privacyPolicy: 'Personvernerklæring',
            language: 'Språk',
            logout: 'Logg ut',
            version: 'FlashFiles v1.0.0',
        },

        // Paywall
        paywall: {
            exclusiveAccess: 'EKSKLUSIV TILGANG',
            trialPeriod: 'Prøveperiode',
            daysLeft: 'DAGER IGJEN',
            instantTransfers: 'Lynraske overføringer',
            instantTransfersDesc: 'Høyhastighets fildeling på tvers av alle enheter.',
            secureEncryption: 'Sikker kryptering',
            secureEncryptionDesc: 'Filene dine er beskyttet med ende-til-ende-sikkerhet.',
            unlockFull: 'Lås opp full versjon',
            continueToApp: 'Fortsett til appen',
        },

        // Alerts
        alerts: {
            permissionDenied: 'Tillatelse nektet',
            photoAccessNeeded: 'Vi trenger tilgang til bildene dine for å laste dem opp.',
            error: 'Feil',
            uploadFailed: 'Kunne ikke laste opp fil',
            cannotAccessVideo: 'Kan ikke åpne video',
            videoAccessHint: 'Denne videoen kan ikke åpnes. Prøv:\\n\\n1. Ta en ny video med kameraet\\n2. Eller bruk \"Fil / Dokument\" alternativet',
        }
    },

    en: {
        // Common
        loading: 'Loading...',

        // Home Screen
        home: {
            uploadTitle: 'Upload file or an image',
            uploadSubtitle: 'Maximum file size: 10MB',
            uploadsSection: 'Uploads',
            noUploads: 'No active uploads',
            noUploadsHint: 'Upload a file to get started',
            sending: 'Sending...',
            sent: 'Sent! 🚀',
            failed: 'Failed',
            preparing: 'Preparing file...',
        },

        // Upload Modal
        upload: {
            chooseType: 'Choose type',
            photoVideo: 'Photo / Video',
            fileDocument: 'File / Document',
            cancel: 'Cancel',
            swipeToSend: 'Swipe up to send',
            addTextOverlay: 'Add Text Overlay',
            title: 'Title',
            description: 'Description',
        },

        // Settings
        settings: {
            title: 'Settings',
            subtitle: 'Manage your account and preferences',
            account: 'Account',
            userAccount: 'User Account',
            proMember: 'Pro Member',
            application: 'Application',
            notifications: 'Notifications',
            privacyPolicy: 'Privacy Policy',
            language: 'Language',
            logout: 'Log Out',
            version: 'FlashFiles v1.0.0',
        },

        // Paywall
        paywall: {
            exclusiveAccess: 'EXCLUSIVE ACCESS',
            trialPeriod: 'Trial Period',
            daysLeft: 'DAYS LEFT',
            instantTransfers: 'Instant Transfers',
            instantTransfersDesc: 'High-velocity file sharing across all devices.',
            secureEncryption: 'Secure Encryption',
            secureEncryptionDesc: 'Your files are protected with end-to-end security.',
            unlockFull: 'Unlock Full Version',
            continueToApp: 'Continue to App',
        },

        // Alerts
        alerts: {
            permissionDenied: 'Permission Denied',
            photoAccessNeeded: 'We need access to your photos to upload them.',
            error: 'Error',
            uploadFailed: 'Failed to upload file',
            cannotAccessVideo: 'Cannot Access Video',
            videoAccessHint: 'This video cannot be accessed. Try:\\n\\n1. Taking a new video with the camera\\n2. Or using "File / Document" option instead',
        }
    }
};

export type Language = 'no' | 'en';
export type Translations = typeof translations.no;
