// Helper để load font Times New Roman từ file
// Font files: times new roman.ttf, times new roman bold.ttf, times new roman italic.ttf

let fontsLoaded = false;
const fontPromises: Promise<FontFace>[] = [];

export const loadTimesNewRomanFonts = async (): Promise<void> => {
  if (fontsLoaded) return;

  try {
    // Load 3 font files
    const normalFont = new FontFace(
      'Times New Roman',
      `url('/times new roman.ttf')`,
      { style: 'normal', weight: '400' }
    );

    const boldFont = new FontFace(
      'Times New Roman',
      `url('/times new roman bold.ttf')`,
      { style: 'normal', weight: '700' }
    );

    const italicFont = new FontFace(
      'Times New Roman',
      `url('/times new roman italic.ttf')`,
      { style: 'italic', weight: '400' }
    );

    fontPromises.push(normalFont.load());
    fontPromises.push(boldFont.load());
    fontPromises.push(italicFont.load());

    const loadedFonts = await Promise.all(fontPromises);
    
    // Add fonts to document
    loadedFonts.forEach(font => {
      document.fonts.add(font);
    });

    fontsLoaded = true;
    console.log('✅ Times New Roman fonts loaded successfully');
  } catch (error) {
    console.warn('⚠️ Failed to load Times New Roman fonts, using fallback:', error);
    // Fallback to system fonts
    fontsLoaded = true; // Mark as loaded to avoid retry
  }
};

// Helper để get font string cho canvas
export const getTimesNewRomanFont = (
  fontSize: number,
  bold: boolean = false,
  italic: boolean = false
): string => {
  const weight = bold ? 'bold' : 'normal';
  const style = italic ? 'italic' : 'normal';
  
  // Try Times New Roman first, fallback to serif
  return `${style} ${weight} ${fontSize}px "Times New Roman", "Times", serif`;
};

// Pre-load fonts when module is imported
if (typeof window !== 'undefined') {
  loadTimesNewRomanFonts();
}

















