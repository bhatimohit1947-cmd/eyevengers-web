import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { SecondaryBanner } from '@/components/home/SecondaryBanner';
import { CategoryRail } from '@/components/home/CategoryRail';
import { SliderBanner } from '@/components/home/SliderBanner';
import { PosterSlider } from '@/components/home/PosterSlider';
import { SpecialsGrid } from '@/components/home/SpecialsGrid';
import { MediaSlider } from '@/components/home/MediaSlider';
import { PromoSlider } from '@/components/home/PromoSlider';
import { Spotlight } from '@/components/home/Spotlight';
import { GuideSlider } from '@/components/home/GuideSlider';
import { CollectionCardsGrid } from '@/components/home/CollectionCardsGrid';
import { SectionRenderer } from '@/components/page-builder/SectionRenderer';
import { Page, SectionInstance } from '@/types/page-builder';

// Fallback Mock Data so the page NEVER breaks even if the backend is down
const FALLBACK_MOCK_DATA = {
  heroBanner: {
    title: "FREE LENS\nREPLACEMENT",
    subtitle: "Any Frame | Any Power | Any Reason",
    ctaLabel: "Find Nearby Stores",
    ctaUrl: "/stores",
    subtextPrimary: "Just pay ₹199 as Fitting Fee",
    subtextSecondary: "Get Premium Anti-Glare Lenses. Upgrades are available",
    bannerImageUrl: "",
    countdownEndDatetime: new Date(Date.now() + 86400000 * 2).toISOString(),
    badgeText: "ENDS IN",
  },
  secondaryBanner: {
    title: "Join hustlr CLUB",
    subtitle: "Get FREE Hustlr Eyeglasses",
    description: "with BLU screen lenses",
    ctaLabel: "Claim Membership",
    bottomRibbonText: "Ending on 16th Aug >",
    bannerImageUrl: "",
    ctaUrl: "/membership"
  },
  eyeglassesCategory: {
    sectionTitle: "Eyeglasses",
    sectionTag: "with Power",
    tiles: [
      { label: "Men", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=men" },
      { label: "Women", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=women" },
      { label: "Kids", imageUrl: "", targetUrl: "/products?category=eyeglasses&gender=kids" },
      { label: "On Sale", imageUrl: "", targetUrl: "/products?category=eyeglasses&sale=true", badgeText: "Starts @ ₹800" },
    ]
  },
  sunglassesCategory: {
    sectionTitle: "Sunglasses",
    sectionTag: "UV Protection",
    tiles: [
      { label: "Men", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=men" },
      { label: "Women", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=women" },
      { label: "Kids", imageUrl: "", targetUrl: "/products?category=sunglasses&gender=kids" },
      { label: "On Sale", imageUrl: "", targetUrl: "/products?category=sunglasses&sale=true", badgeText: "Starts @ ₹500" },
    ]
  },
  contactLensesCategory: {
    sectionTitle: "Contact Lenses & Accessories",
    sectionTag: "Essentials",
    tiles: [
      { label: "Daily Disposable", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=daily" },
      { label: "Monthly", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=monthly" },
      { label: "Color Lenses", imageUrl: "", targetUrl: "/products?category=contact-lenses&type=color" },
      { label: "Solutions", imageUrl: "", targetUrl: "/products?category=accessories&type=solution", badgeText: "Best Seller" },
    ]
  },
  sliderBanner: {
    slides: [
      {
        headline: "Run for Frame",
        subtext: "Experience the lightest frames ever made.",
        imageUrl: "",
        ctaUrl: "/campaigns/run-for-frame"
      },
      {
        headline: "Titanium Series",
        subtext: "Unbreakable. Flexible. Lightweight.",
        imageUrl: "",
        ctaUrl: "/collections/titanium"
      }
    ],
    autoplayMs: 3000
  },
  posterSlider: {
    title: "#Trending at Eyevengers",
    posters: [
      { ctaText: "Shop Spider-Man", ctaUrl: "/collabs/spiderman", imageUrl: "" },
      { ctaText: "Shop Marvel", ctaUrl: "/collabs/marvel", imageUrl: "" },
      { ctaText: "Shop Harry Potter", ctaUrl: "/collabs/harry-potter", imageUrl: "" }
    ]
  },
  specialsGrid: {
    title: "Eyevengers Specials",
    items: [
      { label: "Lens Replace", targetUrl: "/services/lens-replace", ribbonText: "FREE" },
      { label: "Zero Power", targetUrl: "/collections/zero-power" },
      { label: "Reading", targetUrl: "/collections/reading" },
      { label: "Power Sun", targetUrl: "/collections/power-sunglasses" }
    ]
  },
  promoSlider: {
    slides: [
      { imageUrl: "", targetUrl: "/offers/1" },
      { imageUrl: "", targetUrl: "/offers/2" }
    ]
  },
  mediaSlider: {
    cards: [
      { mediaType: "video" as const, title: "FLIP - Convertible Frames", ctaLabel: "Shop Now", ctaUrl: "/products", mediaUrl: "" },
      { mediaType: "image" as const, title: "Air Flex Series", ctaLabel: "Shop Now", ctaUrl: "/products", mediaUrl: "" }
    ]
  },
  spotlight: {
    title: "Spotlight",
    cards: [
      { heading: "Buy online, pick up anytime", description: "At a store near you", ctaUrl: "/stores", backgroundColor: "#f3f4f6", iconPlaceholderColor: "#e5e7eb" },
      { heading: "Gift Cards", description: "Give the gift of perfect vision", ctaUrl: "/gift-cards", backgroundColor: "#fef3c7", iconPlaceholderColor: "#fde68a" }
    ]
  },
  guideSlider: {
    title: "How to buy your glasses",
    guides: [
      { pillLabel: "Step 1", headline: "Select the right frame", backgroundColor: "#0B1550", videoUrl: "" },
      { pillLabel: "Step 2", headline: "Find your frame size", backgroundColor: "#1e3a8a", videoUrl: "" },
      { pillLabel: "Step 3", headline: "Upload prescription", backgroundColor: "#172554", videoUrl: "" }
    ]
  },
  collectionCards: {
    heading: "Exclusively at Eyevengers",
    subheading: "Get the perfect vision and style",
    cards: [
      { title: "Crystal Clear", subtitle: "Transparent Frames", imageUrl: "", accentBorderColor: "#3b82f6", filterQuery: "color=transparent" },
      { title: "Tortoise Shell", subtitle: "Classic Patterns", imageUrl: "", accentBorderColor: "#d97706", filterQuery: "color=tortoise" },
      { title: "Metal Rimless", subtitle: "Minimalist Look", imageUrl: "", accentBorderColor: "#64748b", filterQuery: "type=rimless" },
      { title: "Bold Signature", subtitle: "Thick Acetate", imageUrl: "", accentBorderColor: "#0f172a", filterQuery: "material=acetate" }
    ]
  }
};

async function getHomePageData() {
  // Try to fetch from the CMS Backend
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/cms/pages/home`, { cache: 'no-store' });
    if (!res.ok) throw new Error('CMS Backend unavailable');
    const data = await res.json();
    return data as { page: Page, sections: SectionInstance[] };
  } catch (err) {
    // Silently fallback so the page NEVER breaks
    return null;
  }
}

export default async function Home() {
  const data = await getHomePageData();

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0">
      
      {data && data.sections ? (
        // IF BACKEND IS RUNNING: Render Dynamic Drag-and-Drop Layout
        data.sections.filter(s => s.isVisible).map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))
      ) : (
        // IF BACKEND IS DOWN: Fallback to the perfect hardcoded layout so it NEVER breaks
        <>
          <div>
            <HeroBanner data={FALLBACK_MOCK_DATA.heroBanner} />
          </div>

          <div className="pt-6 pb-8 md:pt-10">
            <SecondaryBanner data={FALLBACK_MOCK_DATA.secondaryBanner} />
          </div>

          <CategoryRail data={FALLBACK_MOCK_DATA.eyeglassesCategory} />
          <CategoryRail data={FALLBACK_MOCK_DATA.sunglassesCategory} />
          <CategoryRail data={FALLBACK_MOCK_DATA.contactLensesCategory} />

          <SliderBanner data={FALLBACK_MOCK_DATA.sliderBanner} />
          <PosterSlider data={FALLBACK_MOCK_DATA.posterSlider} />

          <div className="bg-gray-50 mt-4 border-y border-gray-200">
            <SpecialsGrid data={FALLBACK_MOCK_DATA.specialsGrid} />
          </div>

          <PromoSlider data={FALLBACK_MOCK_DATA.promoSlider} />
          <MediaSlider data={FALLBACK_MOCK_DATA.mediaSlider} />
          <Spotlight data={FALLBACK_MOCK_DATA.spotlight} />
          <GuideSlider data={FALLBACK_MOCK_DATA.guideSlider} />

          <div className="bg-white">
            <CollectionCardsGrid data={FALLBACK_MOCK_DATA.collectionCards} />
          </div>
        </>
      )}

    </div>
  );
}
