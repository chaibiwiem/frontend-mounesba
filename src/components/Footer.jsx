import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconInstagram, IconFacebook, IconTikTok } from './icons';
import { getCategories } from '../services/listingService';

// Une section = un accordeon replie sur mobile/tablette (titre + "+"/"-",
// contenu masque tant que non ouvert - comme la reference fournie), une
// simple colonne toujours ouverte a partir de lg (pas de bouton/etat visible,
// juste le contenu directement affiche).
function FooterSection({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 py-4 lg:border-0 lg:py-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left lg:pointer-events-none lg:cursor-default"
      >
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="text-lg leading-none text-gray-400 lg:hidden">{open ? '−' : '+'}</span>
      </button>
      <div className={`${open ? 'mt-4 block' : 'hidden'} lg:mt-4 lg:block`}>{children}</div>
    </div>
  );
}

// Pied de page global (toutes les pages publiques, cf. App.jsx) : colonnes de
// liens + reseaux sociaux, meme structure qu'une reference fournie par
// l'utilisateur - adaptee au perimetre reel de Mounesba (pas de pages
// CGU/FAQ/suivi de commande pour l'instant, pas d'inscription prestataire en
// libre-service - cf. CLAUDE.md, comptes prestataires crees par l'admin).
// Sur mobile/tablette, chaque colonne devient un accordeon (comme une autre
// reference fournie separement) plutot qu'une grille toujours deployee.
function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.slice(0, 6)))
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="w-full !px-[50px] py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-5 lg:gap-8">
          <FooterSection title="Mounesba">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-rose-600">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/prestataires" className="text-gray-600 hover:text-rose-600">
                  Prestataires
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-rose-600">
                  Contact
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Catégories">
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/categorie/${cat.slug}`} className="text-gray-600 hover:text-rose-600">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          <FooterSection title="Espace prestataire">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-gray-600 hover:text-rose-600">
                  Connexion prestataire
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-rose-600">
                  Devenir prestataire
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Mon compte">
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-gray-600 hover:text-rose-600">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 hover:text-rose-600">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/client/dashboard" className="text-gray-600 hover:text-rose-600">
                  Mes réservations
                </Link>
              </li>
            </ul>
          </FooterSection>

          <FooterSection title="Réseaux sociaux">
            {/* Icones a lier vers les vrais comptes Mounesba des qu'ils
                existeront - volontairement non cliquables pour l'instant
                (pas d'URL a fabriquer). */}
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <IconInstagram className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <IconFacebook className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <IconTikTok className="h-4 w-4" />
              </span>
            </div>
          </FooterSection>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Mounesba. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
