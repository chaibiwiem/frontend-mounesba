import { useEffect, useRef, useState } from 'react';
import ListingCard from './ListingCard';
import { IconChevronLeft, IconChevronRight } from './icons';

// Rangee de fiches prestataires defilable avec fleches, meme structure que
// CategoryCarousel (ref + ResizeObserver pour savoir si ca deborde) - affichee
// sous le bandeau de chaque categorie principale (PrestatairesLanding), avec
// ou sans sous-categories.
function ListingCarousel({ listings, hideContactButton = false, cardWidthClass = 'w-[260px]' }) {
  const scrollRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const checkOverflow = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [listings]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  if (!listings?.length) return null;

  return (
    <div className="relative">
      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Précédent"
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 sm:flex"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex snap-x scroll-smooth gap-4 overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((listing) => (
          <div key={listing.id} className={`${cardWidthClass} shrink-0 snap-start`}>
            <ListingCard listing={listing} hideContactButton={hideContactButton} />
          </div>
        ))}
      </div>

      {overflowing && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Suivant"
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white p-2 text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 sm:flex"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default ListingCarousel;
