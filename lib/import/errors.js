// Error codes returned by the import API. Messages are shown to the user (Arabic).
export const MESSAGES = {
  INVALID_URL: 'الرابط غير صحيح — انسخ رابط المنتج نفسه.',
  DOMAIN_NOT_ALLOWED: 'هذا الموقع غير مدعوم للاستيراد التلقائي.',
  BOT_PROTECTION: 'المتجر يحمي صفحاته من الطلبات الآلية ولا يسمح بقراءتها من الخادم.',
  TIMEOUT: 'المتجر ما رد في الوقت المحدد — غالباً يحجب الطلبات الآلية.',
  NOT_FOUND: 'صفحة المنتج غير موجودة — ممكن انحذف المنتج أو الرابط ناقص.',
  FETCH_FAILED: 'تعذّر الوصول إلى المتجر.',
  NO_IMAGE: 'قرأت الصفحة بس ما لقيت صورة المنتج فيها.',
  TOO_LARGE: 'الصفحة أو الصورة كبيرة جداً.',
  NOT_IMAGE: 'الرابط ما هو صورة.',
  RATE_LIMITED: 'طلبات كثيرة — جرّب بعد شوي.',
};

export class ImportError extends Error {
  constructor(code, detail = '', extra = {}) {
    super(`${code}${detail ? ': ' + detail : ''}`);
    this.code = code;
    this.detail = detail;
    Object.assign(this, extra);
  }
}
