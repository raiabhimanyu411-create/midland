import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { trucks as fallbackTrucks, locations, teamMembers } from '../data/siteData.js';
import { api } from '../utils/api.js';
import { demoDataEnabled } from '../utils/runtime.js';
import { createId } from '../utils/id.js';
import { formatTruckStatus } from '../utils/truckStatus.js';
import { truckUrl } from '../utils/routes.js';
import { truckDisplayPrice, truckDisplayTitle } from '../../../shared/truck.js';
import { SITE_EMAIL } from '../../../shared/seo.js';
import { IconClose, IconDelivery, IconMail, IconPin } from './icons.jsx';
import styles from './ChatAssistant.module.css';

const salesPhone = locations[0]?.phone || '0121 663 1118';
const salesAddress = locations[0]?.address || 'Little Wigston, Swadlincote, DE12 7BJ';

const quickPromptDefs = [
  { key: 'bestUnder55k' },
  { key: 'scaniaMileage' },
  { key: 'automaticEuro6' },
  { key: 'teamPhone' },
  { key: 'bookEnquiry' }
];

const intentTerms = {
  enquiry: [
    'enquiry', 'inquiry', 'reserve', 'reservation', 'book', 'call back', 'callback', 'interested', 'contact me',
    'zapytanie', 'rezerwacja', 'zarezerwuj', 'oddzwon', 'kontakt ze mna', 'jestem zainteresowany', 'umow zapytanie',
    'استفسار', 'احجز', 'حجز', 'اتصل بي', 'تواصل معي', 'مهتم', 'كلمني', 'معاوده اتصال', 'رجعه اتصال', 'عايز احجز', 'بدي احجز'
  ],
  contact: [
    'phone', 'number', 'contact', 'team', 'call', 'sales', 'opening hours', 'hours',
    'telefon', 'numer', 'kontakt', 'zadzwonic', 'sprzedaz', 'godziny pracy', 'zespol',
    'هاتف', 'رقم', 'تليفون', 'تلفون', 'اتصال', 'فريق', 'مبيعات', 'ساعات العمل', 'مواعيد العمل'
  ],
  partExchange: [
    'part exchange', 'trade in', 'trade-in', 'exchange my truck', 'swap my truck', 'px',
    'rozliczeni', 'zamian', 'wymian', 'oddac', 'stara ciezarowka',
    'استبدال', 'استبدل', 'بدل', 'تبديل', 'مبادله', 'بيع شاحنتي', 'عربيتي القديمه', 'شاحنتي القديمه'
  ],
  budget: [
    'cheap', 'cheapest', 'under', 'below', 'budget', 'less than', 'price range', 'affordable',
    'tani', 'tania', 'najtansz', 'ponizej', 'do kwoty', 'budzet', 'cena do', 'najlepsza cena',
    'رخيص', 'ارخص', 'اقل من', 'تحت', 'ميزانيه', 'في حدود', 'سعر مناسب', 'بكام'
  ],
  specification: [
    'automatic', 'manual', 'euro 6', 'euro6', 'ulez', 'caz', 'tipper', 'rigid', 'tractor', 'sleeper', 'axle', 'cab', 'horsepower',
    'automatycz', 'automat', 'manualn', 'euro 6', 'wywrotk', 'ciagnik', 'solowk', 'sypialn', 'os', 'kabin', 'moc',
    'اوتوماتيك', 'اتوماتيك', 'يدوي', 'يورو 6', 'قلابه', 'قلاب', 'جرار', 'شاسيه', 'كابينه نوم', 'محور', 'كابينه', 'حصان'
  ],
  greeting: [
    'hello', 'hi', 'hey', 'help', 'good morning', 'good afternoon', 'namaste', 'salam',
    'czesc', 'dzien dobry', 'witam', 'pomoc', 'hej',
    'مرحبا', 'اهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'مساعده', 'ساعدني', 'ازيك', 'اهلين'
  ],
  thanks: ['thank you', 'thanks', 'cheers', 'dziekuje', 'dzieki', 'شكرا', 'تسلم', 'مشكور'],
  viewing: [
    'viewing', 'view', 'see the truck', 'visit', 'appointment', 'test drive', 'yard',
    'ogledzin', 'obejrz', 'zobacz', 'wizyt', 'spotkani', 'jazda probna', 'plac',
    'معاينه', 'اعاين', 'اشوف', 'شوف', 'زياره', 'موعد', 'تجربه قياده', 'الساحه'
  ],
  availability: [
    'available', 'availability', 'in stock', 'still for sale', 'reserved', 'sold', 'status',
    'dostepn', 'w ofercie', 'sprzedan', 'zarezerwow', 'status',
    'متاح', 'متوفر', 'في المخزون', 'انباعت', 'مباع', 'محجوز', 'الحاله'
  ],
  stock: [
    'show trucks', 'all trucks', 'current stock', 'inventory', 'what trucks', 'recommend a truck', 'best truck',
    'pokaz ciezarowki', 'wszystkie ciezarowki', 'aktualna oferta', 'jakie ciezarowki', 'polec ciezarowke',
    'اعرض الشاحنات', 'كل الشاحنات', 'المخزون الحالي', 'اي شاحنات', 'رشح شاحنه', 'افضل شاحنه'
  ],
  reference: [
    'it', 'this one', 'that one', 'first one', 'second one', 'third one', 'tell me more',
    'ten', 'ta', 'pierwsza', 'pierwszy', 'druga', 'drugi', 'trzecia', 'trzeci', 'wiecej informacji',
    'هذه', 'هذي', 'هذا', 'دي', 'ده', 'هاي', 'الاول', 'الثاني', 'الثالث', 'تفاصيل اكثر'
  ],
  mileage: ['mileage', 'miles', 'run', 'kilometres', 'kilometers', 'km', 'przebieg', 'kilometry', 'مسافه', 'ممشاها', 'عداد', 'كيلومتر'],
  price: ['price', 'cost', 'rate', 'how much', 'kitna', 'cena', 'koszt', 'ile kosztuje', 'سعر', 'بكام', 'كم السعر', 'تكلفه'],
  mot: ['mot', 'inspection', 'service history', 'service', 'test', 'przeglad', 'serwis', 'historia serwisowa', 'badanie', 'فحص', 'صيانه', 'سجل الصيانه'],
  gearbox: ['gearbox', 'automatic', 'manual', 'shift', 'transmission', 'skrzyni', 'automat', 'manualn', 'biegow', 'ناقل الحركه', 'فتيس', 'اوتوماتيك', 'يدوي'],
  location: ['location', 'where', 'viewing', 'yard', 'located', 'lokalizacja', 'gdzie', 'plac', 'موقع', 'فين', 'اين', 'الساحه'],
  warranty: ['warranty', 'owner', 'owners', 'guarantee', 'gwaranc', 'wlasciciel', 'wlasciciele', 'ضمان', 'مالك', 'ملاك'],
  cleanAir: ['euro', 'ulez', 'caz', 'clean air', 'emissions', 'euro 6', 'strefa czystego transportu', 'emisja', 'spaliny', 'يورو', 'هواء نظيف', 'انبعاثات'],
  vat: ['vat', 'plus vat', 'including vat', 'excluding vat', 'net', 'gross', 'brutto', 'netto', 'z vat', 'bez vat', 'ضريبه', 'القيمه المضافه', 'شامل الضريبه', 'بدون ضريبه'],
  axle: ['axle', 'axles', 'wheel configuration', 'os', 'osie', 'uklad osi', 'محور', 'محاور'],
  power: ['power', 'horsepower', 'bhp', 'engine', 'moc', 'konie', 'silnik', 'حصان', 'قوه', 'محرك'],
  cab: ['cab', 'cabin', 'sleeper', 'day cab', 'kabina', 'sypialna', 'كابينه', 'كابينه نوم']
};

const truckQueryAliases = [
  { canonical: 'truck', terms: ['ciezarowka', 'ciezarowki', 'شاحنه', 'شاحنات', 'عربيه', 'عربيات'] },
  { canonical: 'scania', terms: ['scanii', 'سكانيا'] },
  { canonical: 'mercedes', terms: ['mercedesa', 'مرسيدس'] },
  { canonical: 'volvo', terms: ['فولفو'] },
  { canonical: 'daf', terms: ['داف'] },
  { canonical: 'man', terms: ['mana', 'مان'], wholeWord: true },
  { canonical: 'iveco', terms: ['ايفيكو', 'إيفيكو'] },
  { canonical: 'renault', terms: ['رينو'] },
  { canonical: 'automatic', terms: ['automatycz', 'automat', 'اوتوماتيك', 'اتوماتيك'] },
  { canonical: 'manual', terms: ['manualn', 'reczn', 'يدوي', 'مانيوال'] },
  { canonical: 'euro 6', terms: ['euro6', 'يورو 6', 'يورو٦'] },
  { canonical: 'tipper', terms: ['wywrotk', 'قلابه', 'قلاب'] },
  { canonical: 'tractor', terms: ['ciagnik', 'ciagnik siodlowy', 'جرار'] },
  { canonical: 'rigid', terms: ['solowk', 'podwozie sztywn', 'شاسيه'] },
  { canonical: 'sleeper', terms: ['sypialn', 'kabina sypialn', 'كابينه نوم'] },
  { canonical: 'available', terms: ['dostepn', 'متاح', 'متوفر'] }
];

export function ChatAssistant() {
  const { t, i18n } = useTranslation();
  const teamContent = t('content.teamMembers', { returnObjects: true });
  const locationsContent = t('content.locations', { returnObjects: true });
  const team = useMemo(
    () => teamMembers.map((member, index) => ({ ...member, ...teamContent[index] })),
    [teamContent]
  );
  const supportPerson = team.find((member) => member.key === 'support') || team[0];
  const ctx = { t, language: i18n.language, team, supportPerson, locationsContent };

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => [{ id: 'welcome', sender: 'bot', text: t('chat.welcome') }]);
  const [trucks, setTrucks] = useState(() => demoDataEnabled ? fallbackTrucks : []);
  const [loadingStock, setLoadingStock] = useState(true);
  const [enquiry, setEnquiry] = useState({ active: false, name: '', phone: '', email: '', company: '', postcode: '', vehicleType: '', budget: '', budgetVat: 'excluding VAT', purchaseTimeline: '', preferredCallback: '', financeRequired: false, partExchange: false, consent: false, truckId: '', requirement: '' });
  const [submitting, setSubmitting] = useState(false);
  const sessionId = useMemo(() => createId(), []);
  const transcriptRef = useRef(null);

  useEffect(() => {
    async function loadStock() {
      try {
        const response = await api.listTrucks();
        setTrucks(mergeTruckData(response.data || []));
      } catch {
        setTrucks(demoDataEnabled ? fallbackTrucks : []);
      } finally {
        setLoadingStock(false);
      }
    }

    loadStock();
  }, []);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0].id === 'welcome') {
        return [{ id: 'welcome', sender: 'bot', text: t('chat.welcome') }];
      }
      return current;
    });
  }, [i18n.language, t]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, enquiry.active]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const isPhoneLayout = window.matchMedia('(max-width: 720px), (max-height: 650px) and (hover: none)').matches;
    if (!isPhoneLayout) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const stockSummary = useMemo(() => {
    const available = trucks.filter((truck) => String(truck.status || '').toLowerCase() !== 'reserved');
    return t('chat.stockSummary', { count: available.length, range: formatPriceRange(ctx, trucks) });
  }, [trucks, ctx.language]);

  async function sendMessage(messageText = input) {
    const cleanMessage = messageText.trim();
    if (!cleanMessage) return;

    setInput('');
    setEnquiry((current) => ({ ...current, active: false }));
    const userMessage = { id: createId(), sender: 'user', text: cleanMessage };
    const contextTruck = findContextTruck(messages, cleanMessage);
    const botMessage = buildReply(ctx, cleanMessage, trucks, loadingStock, contextTruck);
    setMessages((current) => [...current, userMessage, { ...botMessage, id: createId() }]);

    if (botMessage.showEnquiry) {
      const referencedTruckId = getTruckIdFromPath() || (botMessage.trucks?.length === 1 ? botMessage.trucks[0].id : null);
      setEnquiry((current) => ({
        ...current,
        active: true,
        truckId: referencedTruckId || current.truckId,
        requirement: botMessage.requirement || cleanMessage
      }));
    }
  }

  async function submitEnquiry(event) {
    event.preventDefault();
    const requirement = enquiry.requirement.trim();

    setSubmitting(true);
    try {
      const response = await api.createChatLead({
        ...enquiry, sessionId, requirement, budget: Number(enquiry.budget) || 0,
        truckId: enquiry.truckId ? Number(enquiry.truckId) : null,
        sourcePage: `${window.location.pathname}${window.location.search}`,
        transcript: messages.map(({ sender, text }) => ({ sender, text }))
      });
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          sender: 'bot',
          text: t('chat.replies.thankYou', { name: enquiry.name, phone: salesPhone })
        }
      ]);
      setEnquiry({ active: false, name: '', phone: '', email: '', company: '', postcode: '', vehicleType: '', budget: '', budgetVat: 'excluding VAT', purchaseTimeline: '', preferredCallback: '', financeRequired: false, partExchange: false, consent: false, truckId: '', requirement: '' });
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          sender: 'bot',
          text: t('chat.replies.sendError', { phone: salesPhone })
        }
      ]);
    } finally { setSubmitting(false); }
  }

  return (
    <section className={`${styles.assistant} ${isOpen ? styles.assistantOpen : ''}`} aria-label={t('chat.headerTitle')}>
      {isOpen && (
        <div className={styles.panel} data-lenis-prevent role="dialog" aria-modal="true" aria-label={t('chat.headerTitle')}>
          <header className={styles.header}>
            <div className={styles.avatar} aria-hidden="true">
              MT
            </div>
            <div>
              <p>{t('chat.headerTitle')}</p>
              <span>{loadingStock ? t('chat.checkingStock') : stockSummary}</span>
            </div>
            <button className={styles.iconButton} type="button" onClick={() => setIsOpen(false)} aria-label={t('chat.closeAria')}>
              <IconClose />
            </button>
          </header>

          <div className={styles.transcript} ref={transcriptRef}>
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} t={t} />
            ))}

            {enquiry.active && (
              <form method="post" className={styles.enquiryForm} onSubmit={submitEnquiry}>
                <label>
                  {t('chat.form.nameLabel')}
                  <input
                    value={enquiry.name}
                    onChange={(event) => setEnquiry((current) => ({ ...current, name: event.target.value }))}
                    required
                    placeholder={t('chat.form.namePlaceholder')}
                  />
                </label>
                <label>
                  {t('chat.form.phoneLabel')}
                  <input
                    value={enquiry.phone}
                    onChange={(event) => setEnquiry((current) => ({ ...current, phone: event.target.value }))}
                    required
                    type="tel"
                    placeholder={t('chat.form.phonePlaceholder')}
                  />
                </label>
                <label>
                  {t('chat.form.emailLabel')}
                  <input
                    value={enquiry.email}
                    onChange={(event) => setEnquiry((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    placeholder={t('chat.form.emailPlaceholder')}
                  />
                </label>
                <div className={styles.formRow}>
                  <label>{t('chat.form.companyLabel')}<input value={enquiry.company} onChange={(event) => setEnquiry((c) => ({ ...c, company: event.target.value }))} /></label>
                  <label>{t('chat.form.postcodeLabel')}<input value={enquiry.postcode} onChange={(event) => setEnquiry((c) => ({ ...c, postcode: event.target.value.toUpperCase() }))} placeholder={t('chat.form.postcodePlaceholder')} /></label>
                </div>
                <div className={styles.formRow}>
                  <label>{t('chat.form.vehicleTypeLabel')}<input value={enquiry.vehicleType} onChange={(event) => setEnquiry((c) => ({ ...c, vehicleType: event.target.value }))} placeholder={t('chat.form.vehicleTypePlaceholder')} /></label>
                  <label>{t('chat.form.budgetLabel')}<input type="number" min="0" value={enquiry.budget} onChange={(event) => setEnquiry((c) => ({ ...c, budget: event.target.value }))} /></label>
                </div>
                <label>{t('chat.form.budgetBasisLabel')}<select value={enquiry.budgetVat} onChange={(event) => setEnquiry((c) => ({ ...c, budgetVat: event.target.value }))}><option value="excluding VAT">{t('chat.form.budgetBasisExcl')}</option><option value="including VAT">{t('chat.form.budgetBasisIncl')}</option></select></label>
                <label>{t('chat.form.timelineLabel')}<select value={enquiry.purchaseTimeline} onChange={(event) => setEnquiry((c) => ({ ...c, purchaseTimeline: event.target.value }))}><option value="">{t('chat.form.timelineSelect')}</option><option value="This week">{t('chat.form.timelineThisWeek')}</option><option value="Within 7 days">{t('chat.form.timelineWithin7')}</option><option value="This month">{t('chat.form.timelineThisMonth')}</option><option value="Within 3 months">{t('chat.form.timelineWithin3Months')}</option><option value="Just researching">{t('chat.form.timelineResearching')}</option></select></label>
                <label>{t('chat.form.callbackLabel')}<input value={enquiry.preferredCallback} onChange={(event) => setEnquiry((c) => ({ ...c, preferredCallback: event.target.value }))} placeholder={t('chat.form.callbackPlaceholder')} /></label>
                <div className={styles.checks}>
                  <label><input type="checkbox" checked={enquiry.partExchange} onChange={(event) => setEnquiry((c) => ({ ...c, partExchange: event.target.checked }))} /> {t('chat.form.partExchange')}</label>
                </div>
                <label>
                  {t('chat.form.requirementLabel')}
                  <textarea
                    value={enquiry.requirement}
                    onChange={(event) => setEnquiry((current) => ({ ...current, requirement: event.target.value }))}
                    required
                  />
                </label>
                <label className={styles.consent}>
                  <input type="checkbox" required checked={enquiry.consent} onChange={(event) => setEnquiry((c) => ({ ...c, consent: event.target.checked }))} />{' '}
                  <Trans t={t} i18nKey="chat.form.consentText">
                    I agree that Midland Commercials may contact me about this enquiry. See the <a href="/privacy">Privacy Policy</a>.
                  </Trans>
                </label>
                <button type="submit" disabled={submitting}>{submitting ? t('chat.form.submitSending') : t('chat.form.submitCallback')}</button>
              </form>
            )}
          </div>

          <div className={styles.quickPrompts} aria-label={t('chat.suggestedAria')}>
            {quickPromptDefs.map((prompt) => (
              <button key={prompt.key} type="button" onClick={() => sendMessage(t(`chat.quickPrompts.${prompt.key}`))}>
                {t(`chat.quickPrompts.${prompt.key}`)}
              </button>
            ))}
          </div>

          <form className={styles.composer} onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('chat.composerPlaceholder')}
              aria-label={t('chat.composerAria')}
            />
            <button type="submit" aria-label={t('chat.sendAria')}>
              {t('chat.send')}
            </button>
          </form>
        </div>
      )}

      <button className={styles.launcher} type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen}>
        <span className={styles.launcherIcon} aria-hidden="true">
          <IconMail />
        </span>
        <span>{t('chat.launcher')}</span>
      </button>
    </section>
  );
}

function getTruckIdFromPath() {
  const match = window.location.pathname.match(/^\/truck\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function ChatBubble({ message, t }) {
  return (
    <article className={message.sender === 'user' ? styles.userBubble : styles.botBubble}>
      <p>{message.text}</p>
      {message.trucks?.length > 0 && (
        <div className={styles.truckCards}>
          {message.trucks.map((truck) => (
            <a className={`${styles.truckCard} ${truck.image ? '' : styles.truckCardWithoutImage}`} href={truckUrl(truck)} key={truck.id}>
              {truck.image && <img src={truck.image} alt="" />}
              <div>
                <strong>{truckDisplayTitle(truck)}</strong>
                <span>{formatTruckLine(t, truck)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
      {message.actions?.length > 0 && (
        <div className={styles.actions}>
          {message.actions.map((action) => (
            <a key={action.href} href={action.href}>
              {action.icon === 'pin' && <IconPin />}
              {action.icon === 'delivery' && <IconDelivery />}
              {action.label}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function buildReply(ctx, message, trucks, loadingStock, contextTruck = null) {
  const { t } = ctx;
  const query = normalize(message);
  const matchedTrucks = findMatchingTrucks(query, trucks);

  if (containsAny(query, intentTerms.partExchange)) {
    return {
      sender: 'bot',
      text: t('chat.replies.partExchange'),
      showEnquiry: true,
      requirement: message,
      actions: [{ label: t('chat.actions.partExchangePage'), href: '/part-exchange', icon: 'delivery' }]
    };
  }

  if (containsAny(query, intentTerms.enquiry)) {
    return {
      sender: 'bot',
      text: t('chat.replies.enquiry'),
      showEnquiry: true,
      requirement: message,
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.contact)) {
    return {
      sender: 'bot',
      text: t('chat.replies.phoneInfo', {
        phone: salesPhone,
        email: SITE_EMAIL,
        address: salesAddress,
        hours: ctx.locationsContent[0].hours
      }),
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.budget)) {
    const budget = extractBudget(query);
    const matches = trucks
      .filter((truck) => !budget || truck.priceValue <= budget)
      .sort((a, b) => a.priceValue - b.priceValue)
      .slice(0, 3);

    return {
      sender: 'bot',
      text: matches.length === 0
        ? t('chat.replies.specNoMatch')
        : budget
          ? t('chat.replies.budgetWithAmount', { amount: budget.toLocaleString(ctx.language) })
          : t('chat.replies.budgetGeneric'),
      trucks: matches,
      showEnquiry: matches.length === 0,
      requirement: message,
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.specification)) {
    const matches = bestMatches(query, trucks).slice(0, 3);
    return {
      sender: 'bot',
      text: matches.length ? t('chat.replies.specMatch') : t('chat.replies.specNoMatch'),
      trucks: matches,
      showEnquiry: matches.length === 0,
      requirement: message,
      actions: contactActions(t)
    };
  }

  if (matchedTrucks.length > 0) {
    const truck = matchedTrucks[0];
    return {
      sender: 'bot',
      text: describeTruck(ctx, truck, query),
      trucks: [truck],
      actions: contactActions(t)
    };
  }

  if (contextTruck && isTruckDetailQuery(query)) {
    return {
      sender: 'bot',
      text: describeTruck(ctx, contextTruck, query),
      trucks: [contextTruck],
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.viewing)) {
    return {
      sender: 'bot',
      text: t('chat.replies.viewing'),
      showEnquiry: true,
      requirement: message,
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.availability)) {
    return {
      sender: 'bot',
      text: t('chat.replies.availability'),
      trucks: bestMatches(query, trucks).slice(0, 3),
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.stock)) {
    return {
      sender: 'bot',
      text: t('chat.replies.stockOptions', { count: trucks.length }),
      trucks: bestMatches(query, trucks).slice(0, 3),
      actions: contactActions(t)
    };
  }

  if (containsAny(query, intentTerms.thanks)) {
    return { sender: 'bot', text: t('chat.replies.thanks') };
  }

  if (containsAny(query, intentTerms.greeting)) {
    return {
      sender: 'bot',
      text: t('chat.replies.greeting', {
        stockNote: loadingStock
          ? t('chat.replies.greetingStockChecking')
          : t('chat.replies.greetingStockReady', { count: trucks.length })
      })
    };
  }

  const recommendations = bestMatches(query, trucks).slice(0, 3);
  return {
    sender: 'bot',
    text: t('chat.replies.fallback'),
    trucks: recommendations,
    showEnquiry: recommendations.length === 0,
    requirement: message,
    actions: contactActions(t)
  };
}

function describeTruck(ctx, truck, query) {
  const { t } = ctx;
  const confirm = t('chat.replies.confirmWithSales');
  const lines = [];

  if (containsAny(query, intentTerms.mileage)) {
    lines.push(t('chat.replies.mileageLine', { title: truckDisplayTitle(truck), mileage: truck.mileage || confirm }));
  }
  if (containsAny(query, intentTerms.price)) {
    lines.push(t('chat.replies.priceLine', { price: formatPrice(truck) }));
  }
  if (containsAny(query, intentTerms.mot)) {
    lines.push(t('chat.replies.motLine', { mot: truck.motExpiry || truck.mot || confirm, service: truck.serviceHistory || confirm }));
  }
  if (containsAny(query, intentTerms.gearbox)) {
    lines.push(t('chat.replies.gearboxLine', { gearbox: truck.gearbox || confirm }));
  }
  if (containsAny(query, intentTerms.location)) {
    lines.push(t('chat.replies.locationLine', { location: truck.location || confirm }));
  }
  if (containsAny(query, intentTerms.warranty)) {
    lines.push(t('chat.replies.warrantyLine', { owners: truck.owners || confirm, warranty: truck.warranty || confirm }));
  }
  if (containsAny(query, intentTerms.cleanAir)) {
    lines.push(t('chat.replies.cleanAirLine', { cleanAir: truck.cleanAir || truck.euroRating || truck.badge || confirm }));
  }
  if (containsAny(query, intentTerms.availability)) {
    lines.push(t('chat.replies.availabilityLine', { status: truck.status || confirm }));
  }
  if (containsAny(query, intentTerms.vat)) {
    lines.push(t('chat.replies.vatLine', { vat: truck.vatStatus || confirm }));
  }
  if (containsAny(query, intentTerms.axle)) {
    lines.push(t('chat.replies.axleLine', { axle: truck.axle || confirm }));
  }
  if (containsAny(query, intentTerms.power)) {
    lines.push(t('chat.replies.powerLine', { power: truck.power || confirm }));
  }
  if (containsAny(query, intentTerms.cab)) {
    lines.push(t('chat.replies.cabLine', { cab: truck.cab || confirm }));
  }

  if (lines.length === 0) {
    lines.push(t('chat.replies.fullSummaryLine', {
      title: truckDisplayTitle(truck),
      price: formatPrice(truck),
      mileage: truck.mileage || confirm,
      year: truck.year || confirm,
      gearbox: truck.gearbox || confirm,
      location: truck.location || confirm,
      description: truck.description || confirm
    }));
  }

  lines.push(t('chat.replies.callToAction', { phone: salesPhone }));
  return lines.join(' ');
}

function isTruckDetailQuery(query) {
  return [
    'mileage', 'price', 'mot', 'gearbox', 'location', 'warranty', 'cleanAir',
    'availability', 'vat', 'axle', 'power', 'cab', 'viewing', 'reference'
  ].some((intent) => containsAny(query, intentTerms[intent]));
}

function findContextTruck(messages, message) {
  const recentMessage = [...messages].reverse().find((item) => item.trucks?.length);
  if (!recentMessage) return null;

  const query = normalize(message);
  const secondTerms = ['second', '2nd', 'druga', 'drugi', 'drugiej', 'الثاني', 'الثانيه', 'التاني', 'التانيه'];
  const thirdTerms = ['third', '3rd', 'trzecia', 'trzeci', 'trzeciej', 'الثالث', 'الثالثه', 'التالت', 'التالته'];
  if (containsAny(query, thirdTerms)) return recentMessage.trucks[2] || recentMessage.trucks[0];
  if (containsAny(query, secondTerms)) return recentMessage.trucks[1] || recentMessage.trucks[0];
  return recentMessage.trucks[0];
}

function findMatchingTrucks(query, trucks) {
  return trucks
    .map((truck) => ({ truck, score: scoreTruck(query, truck, true) }))
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.truck);
}

function bestMatches(query, trucks) {
  return trucks
    .map((truck) => ({ truck, score: scoreTruck(query, truck, false) }))
    .sort((a, b) => b.score - a.score || a.truck.priceValue - b.truck.priceValue)
    .map((item) => item.truck);
}

function scoreTruck(query, truck, strict) {
  const fields = [
    truck.title,
    truck.make,
    truck.type,
    truck.year,
    truck.registration,
    truck.gearbox,
    truck.badge,
    truck.status,
    truck.axle,
    truck.cab,
    truck.power,
    truck.location,
    truck.cleanAir,
    truck.euroRating,
    truck.description
  ];
  const haystack = normalize(fields.filter(Boolean).join(' '));
  const searchableQuery = canonicalizeTruckQuery(query);
  const tokens = searchableQuery.split(/\s+/).filter((token) => token.length > 2);
  let score = 0;

  tokens.forEach((token) => {
    if (haystack.includes(token)) score += strict ? 4 : 2;
  });

  if (new RegExp(`\\b${truck.id}\\b`).test(query)) score += strict ? 6 : 3;
  if (truck.status?.toLowerCase() === 'available') score += 1;
  return score;
}

function mergeTruckData(apiTrucks) {
  return apiTrucks.map((truck) => {
    const fallback = demoDataEnabled ? fallbackTrucks.find((item) => item.id === truck.id) || {} : {};
    return { ...fallback, ...truck };
  });
}

function contactActions(t) {
  return [
    { label: t('chat.actions.contactPage'), href: '/contact', icon: 'pin' },
    { label: t('chat.actions.allTrucks'), href: '/trucks', icon: 'delivery' }
  ];
}

function containsAny(text, terms) {
  const words = new Set(text.split(/\s+/));
  return terms.some((term) => {
    const normalizedTerm = normalize(term);
    return normalizedTerm.length <= 2 ? words.has(normalizedTerm) : text.includes(normalizedTerm);
  });
}

function normalize(value) {
  return convertArabicDigits(String(value))
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function convertArabicDigits(value) {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const easternArabicDigits = '۰۱۲۳۴۵۶۷۸۹';
  return value
    .replace(/[٠-٩]/g, (digit) => arabicDigits.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => easternArabicDigits.indexOf(digit));
}

function canonicalizeTruckQuery(query) {
  const words = new Set(query.split(/\s+/));
  const aliases = truckQueryAliases
    .filter(({ terms, wholeWord }) => (wholeWord ? terms.some((term) => words.has(normalize(term))) : containsAny(query, terms)))
    .map(({ canonical }) => canonical);
  return `${query} ${aliases.join(' ')}`.trim();
}

function extractBudget(query) {
  const candidates = [...query.matchAll(/(gbp|pound|pounds|under|below|less than|ponizej|do|تحت|اقل من)?\s*(\d+(?:\.\d+)?)\s*(k|tys|000)?/g)]
    .map((match) => ({
      number: Number(match[2]),
      hasPrefix: Boolean(match[1]),
      hasSuffix: Boolean(match[3]),
      afterEuro: /euro\s*$|يورو\s*$/.test(query.slice(0, match.index))
    }))
    .filter((item) => Number.isFinite(item.number) && !item.afterEuro);

  const best = candidates.find((item) => item.hasPrefix || item.hasSuffix) || candidates.find((item) => item.number >= 1000 && !(item.number >= 1980 && item.number <= 2039));
  if (!best) return null;
  return best.hasSuffix || best.number < 1000 ? Math.round(best.number * 1000) : Math.round(best.number);
}

function formatPrice(truck) {
  return truckDisplayPrice(truck);
}

function formatTruckLine(t, truck) {
  return `${formatPrice(truck)} | ${truck.mileage} | ${truck.gearbox} | ${formatTruckStatus(t, truck.status)}`;
}

function formatPriceRange(ctx, trucks) {
  const prices = trucks.map((truck) => truck.priceValue).filter(Boolean);
  if (prices.length === 0) return ctx.t('chat.replies.currentStockFallback');

  return `£${Math.min(...prices).toLocaleString(ctx.language)}-${Math.max(...prices).toLocaleString(ctx.language)}`;
}
