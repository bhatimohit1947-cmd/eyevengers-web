import { SectionInstance } from '@/types/page-builder';

// Import all section components
import { HeroBanner } from '@/components/home/HeroBanner';
import { SecondaryBanner } from '@/components/home/SecondaryBanner';
import { CategoryRail } from '@/components/home/CategoryRail';
import { PromoSlider } from '@/components/home/PromoSlider';
import { MediaSlider } from '@/components/home/MediaSlider';
import { PosterSlider } from '@/components/home/PosterSlider';
import { SpecialsGrid } from '@/components/home/SpecialsGrid';
import { Spotlight } from '@/components/home/Spotlight';
import { GuideSlider } from '@/components/home/GuideSlider';
import { CollectionCardsGrid } from '@/components/home/CollectionCardsGrid';
import { SliderBanner } from '@/components/home/SliderBanner';

interface SectionRendererProps {
  section: SectionInstance;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const { sectionType, configJson } = section;

  switch (sectionType as string) {
    case 'hero_banner':
      return <HeroBanner data={configJson} />;
    case 'secondary_banner':
      return (
        <div className="pt-6 pb-8 md:pt-10">
          <SecondaryBanner data={configJson} />
        </div>
      );
    case 'CategoryRail':
    case 'category_rail':
      return <CategoryRail data={configJson} />;
    case 'PromoSlider':
    case 'promo_slider':
      return <PromoSlider data={configJson} />;
    case 'MediaSlider':
    case 'media_slider':
      return <MediaSlider data={configJson} />;
    case 'PosterSlider':
    case 'poster_slider':
      return <PosterSlider data={configJson} />;
    case 'SpecialsGrid':
    case 'specials_grid':
      return (
        <div className="bg-gray-50 mt-4 border-y border-gray-200">
          <SpecialsGrid data={configJson} />
        </div>
      );
    case 'Spotlight':
    case 'spotlight':
      return <Spotlight data={configJson} />;
    case 'GuideSlider':
    case 'guide_slider':
      return <GuideSlider data={configJson} />;
    case 'CollectionCardsGrid':
    case 'collection_grid':
      return (
        <div className="bg-white">
          <CollectionCardsGrid data={configJson} />
        </div>
      );
    case 'SliderBanner':
    case 'slider_banner':
      return <SliderBanner data={configJson} />;
    default:
      console.warn(`Unknown section type: ${sectionType}`);
      return null;
  }
}
