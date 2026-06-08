export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-100 py-10 mt-auto md:mb-0 mb-16">
      <div className="container mx-auto px-6 flex flex-col items-center justify-center text-center space-y-3">
        
        {/* Dekorasi Garis Hijau Emerald */}
        <div className="w-12 h-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full mb-1"></div>
        
        <h3 className="font-bold text-lg text-emerald-600 tracking-wide">
          Smart Cell English
        </h3>
        
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          Platform Microlearning Bahasa Inggris interaktif yang dirancang khusus untuk mendukung akselerasi potensi edukasi anak binaan di LPKA Kelas II Yogyakarta.
        </p>
        
        {/* Hak Cipta & Kemitraan */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-xs text-slate-400 font-medium border-t border-slate-100 w-full max-w-lg">
          <span>&copy; {new Date().getFullYear()} Tim PKM-PM Universitas Ahmad Dahlan</span>
          <span className="hidden sm:inline text-slate-300">&bull;</span>
          <span className="text-emerald-600/80">Mitra Resmi LPKA Kelas II Yogyakarta</span>
        </div>

      </div>
    </footer>
  );
}