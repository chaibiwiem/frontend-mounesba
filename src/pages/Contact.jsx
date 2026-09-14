import { IconMail, IconClock } from '../components/icons';

const CONTACT_EMAIL = 'contact@mounesba.tn';

function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:!px-[90px]">
      <h1
        className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Contactez-nous
      </h1>
      <p className="mt-3 text-gray-600">
        Une question sur la plateforme, votre inscription en tant que prestataire, ou tout
        simplement besoin d&apos;aide ? Écrivez-nous, notre équipe vous répond au plus vite.
      </p>

      <div className="mt-8 space-y-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-rose-300 hover:bg-rose-50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <IconMail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{CONTACT_EMAIL}</p>
          </div>
        </a>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <IconClock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-gray-500">Délai de réponse</p>
            <p className="font-medium text-gray-900">Sous 48h ouvrées</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Vous cherchez un prestataire pour votre événement ? Rendez-vous directement sur sa fiche
        pour lui envoyer une demande de devis — c&apos;est gratuit et sans engagement.
      </p>
    </div>
  );
}

export default Contact;
