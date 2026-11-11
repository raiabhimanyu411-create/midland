// Stock landing pages by body type and by make ("Used Tractor Units for Sale", "Used DAF Trucks for Sale").
// Shared by the client page, the server-rendered HTML, the sitemap and llms.txt, so crawlers see the same text.
// Keep each page's copy unique, and never mention finance or delivery (client rule).

export const CATEGORY_BASE_PATH = '/trucks';

const lower = (value) => String(value || '').toLowerCase();
const bodyText = (truck) => `${lower(truck.type)} ${lower(truck.title)}`;

export const categoryPages = [
  {
    slug: 'tractor-units',
    kind: 'type',
    name: 'Tractor Units',
    filter: { body: 'Tractor unit' },
    match: (truck) => /tractor/.test(lower(truck.type)),
    title: 'Used Tractor Units for Sale UK | Midland Commercials',
    description: 'Used tractor units for sale from UK fleets. 4x2 and 6x2 units from DAF, Scania, Volvo, MAN and Mercedes-Benz with VAT, MOT and Euro rating shown.',
    heading: 'Used Tractor Units for Sale',
    intro: 'Checked used tractor units from UK fleets, ready to view at our Swadlincote yard. Every listing shows the axle layout, cab, mileage, gearbox, VAT status, MOT and Euro rating, so you can shortlist the right unit before you pick up the phone.',
    sections: [
      {
        heading: '4x2 or 6x2: Choosing the Right Unit',
        paragraphs: [
          'Most of the tractor units we sell are either 4x2 or 6x2. A 4x2 is lighter, cheaper to run and easier to place in tight yards, and it suits general haulage at weights below the 44 tonne limit. A 6x2 with a mid-lift or rear-steer axle spreads the load and is the usual choice for operators running at 44 tonnes every day. Our guide to [4x2 vs 6x2 tractor units](/blog/4x2-vs-6x2-tractor-units) goes through the trade-offs in more detail.',
          'Cab choice matters just as much. Day cabs suit trunking and local work where drivers go home each night, while sleeper and high-roof cabs make sense for nights out. We list the cab type on every advert so you can filter out what does not suit your work.'
        ]
      },
      {
        heading: 'What We Check Before a Unit Goes on Sale',
        paragraphs: [
          'Before a tractor unit is listed we go through the service history, look at the fifth wheel, tyres, brakes and air lines, and check the cab and chassis for damage or corrosion. We also note the tachograph type and the Euro rating, which affects clean air zone charges in cities such as Birmingham and London.',
          'If we find anything worth knowing, we put it in the description. You can also ask for extra photos or a walkaround video before you travel. Our [used tractor unit buying checklist](/blog/used-tractor-unit-buying-checklist) explains what to look at when you view one yourself.'
        ]
      },
      {
        heading: 'Makes and Models We Stock',
        paragraphs: [
          'Our units come from UK fleets and operators, so we tend to see the models that are popular on British roads: [DAF](/trucks/daf) XF and CF, [Scania](/trucks/scania) R and S series, [Volvo](/trucks/volvo) FH, [MAN](/trucks/man) TGX and [Mercedes-Benz](/trucks/mercedes-benz) Actros. Stock changes every week, so if the unit you want is not listed, set up a free stock alert and we will tell you when one arrives.'
        ]
      },
      {
        heading: 'Part Exchange Your Current Unit',
        paragraphs: [
          'Replacing an older Euro 5 unit with a Euro 6? We take tractor units, rigids, vans and trailers in part exchange against your next truck. Send the registration, mileage and a few photos through our [part exchange page](/part-exchange) and we will come back with a valuation.'
        ]
      }
    ],
    faqs: [
      { question: 'Are your tractor units Euro 6?', answer: 'Most are, and the Euro rating is shown on every listing. Always check the registration on the official clean air zone vehicle checker before driving into a charging zone.' },
      { question: 'Can I view a tractor unit at the weekend?', answer: 'Yes. Our Swadlincote yard is open Monday to Sunday, 8:00am to 6:00pm. Call 0121 663 1118 before you travel so we can have the unit and its paperwork ready.' },
      { question: 'Do you sell trailers to go with a unit?', answer: 'We stock trailers when they come in from UK fleets. See our used trailers page, or tell us what you need and we will let you know when a match arrives.' }
    ],
    guides: ['4x2-vs-6x2-tractor-units', 'used-tractor-unit-buying-checklist', 'best-used-tractor-units-uk']
  },
  {
    slug: 'tippers',
    kind: 'type',
    name: 'Tippers',
    filter: { body: 'Tipper' },
    match: (truck) => /tipper|grab/.test(bodyText(truck)),
    title: 'Used Tipper Trucks for Sale UK | Midland Commercials',
    description: 'Used tipper trucks for sale: 8x4, 6x4 and 4x2 tippers and grab loaders from UK fleets, checked before sale. Clear VAT and MOT details. Part exchange welcome.',
    heading: 'Used Tipper Trucks for Sale',
    intro: 'Used tippers and grab loaders for builders, groundworkers, quarries and plant hire firms. Every truck is checked before sale and listed with its axle layout, body, mileage, gearbox, VAT status, MOT and Euro rating.',
    sections: [
      {
        heading: 'Choosing a Used Tipper',
        paragraphs: [
          'The right tipper depends on what you carry and where you go. An 8x4 at 32 tonnes is the workhorse for aggregates, muck-away and quarry work. A 6x4 or 4x2 tipper is lighter and more manoeuvrable for town-centre jobs, landscaping and smaller building sites. Grab loaders add a crane, so you can load and unload without a separate machine.',
          'Body type matters too. Steel bodies stand up to rubble and stone, while aluminium bodies are lighter and give you more payload on lighter loads. Some trucks have insulated bodies for tarmac. We note the body on every listing.'
        ]
      },
      {
        heading: 'What to Check on a Working Tipper',
        paragraphs: [
          'Tippers work harder than most trucks, so condition varies a lot. We look at the tipping ram and hydraulics, the body floor and tailgate, the chassis for cracks, the suspension, and the tyres, which wear quickly on site. We also check the service history and the MOT record.',
          'Our [used tipper truck buying guide](/blog/used-tipper-truck-buying-guide) explains what to look for when you view one, from hydraulic leaks to signs of overloading.'
        ]
      },
      {
        heading: 'Popular Tipper Makes',
        paragraphs: [
          'UK construction fleets often run [MAN](/trucks/man) TGS, [Volvo](/trucks/volvo) FMX, [Scania](/trucks/scania) P and G series, [DAF](/trucks/daf) CF and [Mercedes-Benz](/trucks/mercedes-benz) Arocs tippers. When we take one in, we list it with photos and full details.',
          'Tippers sell quickly, especially in spring and summer. If you need one for a particular job, set up a free stock alert with the axle layout, body and budget you want.'
        ]
      },
      {
        heading: 'Trade In Your Old Tipper',
        paragraphs: [
          'We take tippers, plant lorries and vans in part exchange. Send your registration, mileage and photos through our [part exchange page](/part-exchange) for a valuation against your next truck.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell 8x4 tippers?', answer: 'Yes, when they come in from UK fleets. Stock changes weekly, so set up a free stock alert if you do not see the right one listed today.' },
      { question: 'Can I check a tipper is legal for clean air zones?', answer: 'Each listing shows the Euro rating. Euro 6 trucks meet the standard in UK clean air zones, but always check the registration on the official vehicle checker.' },
      { question: 'Will you film the tipper working?', answer: 'Yes. We can film a walkaround video showing the engine starting and the body tipping, so you can see it working before you travel.' }
    ],
    guides: ['used-tipper-truck-buying-guide', 'clean-air-zones-hgv-guide', 'check-used-hgv-mot-history-paperwork']
  },
  {
    slug: 'grab-loaders',
    kind: 'type',
    name: 'Grab Loaders',
    match: (truck) => /grab/.test(bodyText(truck)),
    title: 'Used Grab Lorry for Sale UK | Midland Commercials',
    description: 'Used grab lorries for sale: 8x4 and 6x4 tipper grabs with behind-cab cranes, checked before sale. LOLER, MOT, VAT and Euro rating shown on every listing.',
    heading: 'Used Grab Lorries for Sale',
    intro: 'Used grab lorries and tipper grabs for groundworkers, landscapers, waste firms and plant hire companies. Every truck is checked before sale and listed with its chassis, crane, body, mileage, VAT status, MOT and Euro rating.',
    sections: [
      {
        heading: 'Choosing a Used Grab Lorry',
        paragraphs: [
          'Most grab lorries in the UK are 8x4 tippers at 32 tonnes with the crane mounted behind the cab. They carry the most and suit muck-away, aggregates and site clearance. A 6x4 grab at 26 tonnes is shorter and easier to place on tight sites and in town, while a 4x2 grab suits landscaping and smaller jobs.',
          'Think about payload before anything else. The crane, stabilisers and grab can weigh several tonnes, so a grab lorry carries less than a plain tipper on the same chassis. We list the unladen weight where we have it, so you can work out what the truck will legally carry.'
        ]
      },
      {
        heading: 'What We Check on the Crane and Grab',
        paragraphs: [
          'We run the crane through every movement and look for play in the slew ring, worn pins and bushes, leaks at the rams and hoses, and stabilisers that creep. We check the rotator, the grab bucket and its teeth, and the seat or remote controls. On the truck we look at the tipping body, the subframe around the crane mounting, the suspension and the service history.',
          'Grab cranes need a LOLER thorough examination at least every 12 months. We show the date of the last examination where we have the report. Our [grab lorry buying guide](/blog/grab-lorry-buying-guide) explains everything worth checking when you view one yourself.'
        ]
      },
      {
        heading: 'Grab Lorries and Tippers',
        paragraphs: [
          'Not every job needs a crane. If you are loading with a machine on site, a plain tipper carries more for the same money. See our [used tipper trucks for sale](/trucks/tippers) and our [used tipper buying guide](/blog/used-tipper-truck-buying-guide) to compare.'
        ]
      },
      {
        heading: 'Part Exchange and Stock Alerts',
        paragraphs: [
          'We take tippers, grabs, rigids and vans in [part exchange](/part-exchange). Grab lorries do not stay in stock long, so tell us the chassis, crane and controls you want and we will let you know when a match arrives.'
        ]
      }
    ],
    faqs: [
      { question: 'What is a grab lorry?', answer: 'A grab lorry is a tipper truck with a hydraulic crane and grab bucket, so the driver can load and unload loose material such as soil, aggregates and waste without a separate machine.' },
      { question: 'Do your grab lorries come with LOLER paperwork?', answer: 'We show the date of the last LOLER thorough examination on the listing where we have the report, and you can see the paperwork when you view the truck.' },
      { question: 'Can I see the crane working before I buy?', answer: 'Yes. Our Swadlincote yard is open Monday to Sunday, 8:00am to 6:00pm. Call 0121 663 1118 before you travel and we will have the truck ready to demonstrate.' }
    ],
    guides: ['grab-lorry-buying-guide', 'used-tipper-truck-buying-guide', 'euro-6-truck-checklist-adblue-dpf']
  },
  {
    slug: 'crane',
    kind: 'type',
    name: 'HIAB and Crane Trucks',
    match: (truck) => /crane|hiab|palfinger|fassi|effer|loader crane/.test(bodyText(truck)) && !/grab/.test(bodyText(truck)),
    title: 'HIAB Lorry for Sale UK | Crane Trucks | Midland Commercials',
    description: 'Used HIAB lorries and crane trucks for sale: tractor units and rigids with loader cranes, checked before sale, with LOLER, MOT, VAT and Euro rating shown.',
    heading: 'Used HIAB and Crane Trucks for Sale',
    intro: 'Used crane tractor units and crane rigids for building materials, steel, timber, precast and plant. Every truck is checked before sale and listed with its crane, chassis, mileage, VAT status, MOT and Euro rating.',
    sections: [
      {
        heading: 'Crane Tractor Unit or Crane Rigid?',
        paragraphs: [
          'A crane tractor unit pulls a flatbed trailer and suits long lengths such as steel, timber and roof trusses, with the most payload per trip. A crane rigid carries its load on its own flatbed and is easier to place on tight urban sites. Most crane tractor units are 6x2, because the extra axle helps carry the weight of the crane.',
          'People in the UK often call any lorry with a loader crane a HIAB, after the best-known maker. We list the actual crane make and model, such as HIAB, Palfinger or Fassi, on every advert where we have it.'
        ]
      },
      {
        heading: 'Crane Size, Reach and Payload',
        paragraphs: [
          'Loader cranes are rated in tonne-metres. Look at the load chart for the weight the crane can lift at the reach you need, not just its maximum lift close to the truck. A bigger crane lifts more but weighs more, which comes off your payload, so choose the crane for the work you do most often.',
          'Our [HIAB and crane tractor unit buying guide](/blog/hiab-crane-tractor-unit-buying-guide) explains crane sizes, fifth wheel position and what to check on a used crane.'
        ]
      },
      {
        heading: 'What We Check Before Sale',
        paragraphs: [
          'We run the crane through its full range, test the controls, overload protection and stabilisers, and look for play in the slew, worn pins, damaged extensions and leaks. On the truck we check the chassis around the crane mounting, the fifth wheel on tractor units, the brakes, tyres and service history. We show the date of the last LOLER thorough examination where we have the report.'
        ]
      },
      {
        heading: 'Part Exchange and Stock Alerts',
        paragraphs: [
          'Crane trucks are hard to find in good condition, so tell us the crane size, reach and chassis you need and we will let you know when one arrives. We also take your current truck in [part exchange](/part-exchange).'
        ]
      }
    ],
    faqs: [
      { question: 'What is a HIAB lorry?', answer: 'A HIAB lorry is a truck with a hydraulic loader crane. HIAB is a crane maker, but the name is used in the UK for any lorry-mounted crane.' },
      { question: 'Do you sell tractor units with cranes?', answer: 'Yes, when they come in from UK fleets. Crane tractor units are listed here and on our used tractor units page.' },
      { question: 'What paperwork comes with a crane truck?', answer: 'Where we have them, we provide the latest LOLER thorough examination report, the crane manual and load chart, and the truck’s service and MOT records.' }
    ],
    guides: ['hiab-crane-tractor-unit-buying-guide', 'what-is-a-tractor-unit', 'best-used-tractor-units-uk']
  },
  {
    slug: 'rigids',
    kind: 'type',
    name: 'Rigids',
    filter: { body: 'Rigid' },
    match: (truck) => {
      const text = lower(truck.type);
      return !/tractor|tipper|trailer/.test(text) && /rigid|curtain|box|dropside|flatbed|beavertail|tail ?lift|luton|skip|hook|tanker|refrigerat|fridge/.test(text);
    },
    title: 'Used Rigid Trucks for Sale UK | Midland Commercials',
    description: 'Used rigid trucks for sale, from 7.5 tonne to 26 tonne and 32 tonne. Curtainsiders, box bodies and dropsides with tail lifts, checked before sale.',
    heading: 'Used Rigid Trucks for Sale',
    intro: 'Used rigid lorries for distribution, multi-drop and trade work, from 7.5 tonne up to 26 tonne and 32 tonne. Curtainsiders, box bodies, dropsides and flatbeds, many with tail lifts, all checked before they go on sale.',
    sections: [
      {
        heading: 'Which Weight of Rigid Do You Need?',
        paragraphs: [
          'A 7.5 tonne rigid can be driven on a C1 licence by many drivers and suits local distribution and trades. 12 tonne and 18 tonne rigids are the most common choice for regional distribution, giving a good payload while staying easy to drive in towns. 26 tonne rigids on three axles carry more for builders merchants and heavier freight, and 32 tonne four-axle rigids are mostly tippers and mixers.',
          'Remember that anything over 7.5 tonnes needs a Category C licence and an operator licence. Our guide to [starting a haulage business](/blog/starting-haulage-business-operator-licence) covers what you need before you buy.'
        ]
      },
      {
        heading: 'Body Types and Tail Lifts',
        paragraphs: [
          'Curtainsiders are the most flexible body for pallet work, while box bodies keep loads secure and dry. Dropsides and flatbeds suit building materials, and beavertails are used for plant. A tail lift makes multi-drop work far easier where there is no loading bay. We list the body, tail lift and internal dimensions where we have them.',
          'Not sure whether a rigid or an artic suits your work better? Read our comparison of a [rigid truck vs a tractor unit](/blog/rigid-truck-vs-tractor-unit).'
        ]
      },
      {
        heading: 'Checked Before Sale',
        paragraphs: [
          'Every rigid is checked over before it is listed. We look at the body, curtains or box panels, the tail lift and its inspection record, tyres, brakes and the service history, and we tell you about anything we find. Popular models include the [DAF](/trucks/daf) LF and CF, [Iveco](/trucks/iveco) Eurocargo, [MAN](/trucks/man) TGL and TGM and [Mercedes-Benz](/trucks/mercedes-benz) Atego and Antos.'
        ]
      },
      {
        heading: 'View or Part Exchange',
        paragraphs: [
          'Our yard is open Monday to Sunday, 8:00am to 6:00pm. You can also [part exchange](/part-exchange) your current van or rigid against the next one.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell 18 tonne lorries?', answer: 'Yes. 18 tonne rigids are one of the most common trucks we sell. Set up a free stock alert if you are waiting for a particular body or tail lift.' },
      { question: 'Does a rigid with a tail lift need a LOLER inspection?', answer: 'Yes. Tail lifts should have a thorough examination every six months under LOLER. We tell you when the last inspection was done where we have the record.' },
      { question: 'Can I drive a 7.5 tonne rigid on a car licence?', answer: 'Only if you passed your car test before 1 January 1997 and have C1 on your licence. Otherwise you need to pass the C1 test.' }
    ],
    guides: ['rigid-truck-vs-tractor-unit', 'starting-haulage-business-operator-licence', 'check-used-hgv-mot-history-paperwork']
  },
  {
    slug: 'trailers',
    kind: 'type',
    name: 'Trailers',
    filter: { body: 'Trailer' },
    match: (truck) => /trailer/.test(lower(truck.type)),
    title: 'Used HGV Trailers for Sale UK | Midland Commercials',
    description: 'Used HGV trailers for sale: curtainsiders, box vans, flatbeds and tipping trailers from UK fleets. Checked before sale, with MOT and plating details.',
    heading: 'Used HGV Trailers for Sale',
    intro: 'Used semi-trailers from UK fleets: curtainsiders, box vans, flatbeds, step frames and tipping trailers. Each one is checked before sale and listed with its MOT, axle layout and plated weight.',
    sections: [
      {
        heading: 'Trailer Types We Sell',
        paragraphs: [
          'Tri-axle curtainsiders are the backbone of UK pallet and general haulage, and most fleets run them at 44 tonnes. Box vans and double-deck trailers suit retail and parcel work, flatbeds and step frames carry steel, timber and machinery, and tipping trailers move aggregates and bulk loads.',
          'When choosing a trailer, check the plated weight, the axle type and whether it has rear-steer, which helps in tight yards. We list these details on every advert where we have them.'
        ]
      },
      {
        heading: 'What We Check on a Used Trailer',
        paragraphs: [
          'We look at the chassis and crossmembers, the floor, curtains, straps and buckles or box panels and doors, the brakes, the suspension and the lights. We also check the MOT and plating certificate. A trailer has its own annual test, separate from the tractor unit.',
          'Our guide to [checking a used HGV’s MOT history and paperwork](/blog/check-used-hgv-mot-history-paperwork) explains how to check trailer records too.'
        ]
      },
      {
        heading: 'Matching a Trailer to Your Unit',
        paragraphs: [
          'Make sure the trailer’s kingpin height and coupling suit your [tractor unit](/trucks/tractor-units), and that the combination stays within 44 tonnes on six axles. If you are buying a unit and trailer together, tell us and we will check they work as a pair.'
        ]
      },
      {
        heading: 'Trade In or Get a Stock Alert',
        paragraphs: [
          'We take trailers in [part exchange](/part-exchange) against your next vehicle. Trailers do not stay in stock long, so set up a free stock alert with the type and length you need.'
        ]
      }
    ],
    faqs: [
      { question: 'Do trailers need an MOT?', answer: 'Yes. HGV trailers over 3,500kg have their own annual test. We show the MOT expiry on the listing where we have it.' },
      { question: 'Can I see a trailer before I buy?', answer: 'Yes. Our Swadlincote yard is open Monday to Sunday, 8:00am to 6:00pm. We can also send extra photos or a walkaround video.' },
      { question: 'Do you take trailers in part exchange?', answer: 'Yes. Send the details and photos through our part exchange page for a valuation.' }
    ],
    guides: ['check-used-hgv-mot-history-paperwork', '4x2-vs-6x2-tractor-units', 'hgv-road-user-levy-rates']
  },
  {
    slug: 'daf',
    kind: 'make',
    name: 'DAF',
    make: 'DAF',
    filter: { make: 'DAF' },
    title: 'Used DAF Trucks for Sale UK | Midland Commercials',
    description: 'Used DAF trucks for sale: XF and CF tractor units and LF and CF rigids from UK fleets. Checked before sale, with VAT, MOT and Euro rating shown.',
    heading: 'Used DAF Trucks for Sale',
    intro: 'DAF is one of the best-selling truck makes in the UK, and many are built at Leyland in Lancashire. We sell used DAF XF and CF tractor units and LF and CF rigids from UK fleets, each checked before sale.',
    sections: [
      {
        heading: 'Popular Used DAF Models',
        paragraphs: [
          'The DAF XF is a long-haul tractor unit with a roomy cab, popular with owner-drivers and fleets for nights out. The CF is a versatile all-rounder, available as a tractor unit, rigid or tipper. The LF is DAF’s light and medium rigid, usually from 7.5 to 18 tonnes, and a common choice for local distribution.',
          'Newer DAF XG and XG+ models have larger cabs and are starting to appear on the used market as fleets replace them.'
        ]
      },
      {
        heading: 'Why UK Operators Choose DAF',
        paragraphs: [
          'DAFs are known for good fuel economy, comfortable cabs and a wide dealer network across the UK, which makes parts and servicing easy to find. They also hold their value well, which matters when you come to sell or part exchange.',
          'Most used DAFs on the market are Euro 6, which keeps you clear of clean air zone charges. We list the Euro rating on every advert.'
        ]
      },
      {
        heading: 'What We Check on a Used DAF',
        paragraphs: [
          'We go through the service history, look at the cab, chassis and tyres, check the gearbox and AdBlue system, and note any warning lights or known faults. If anything needs attention, we tell you before you travel.',
          'Comparing makes? Read our guide to the [best used tractor units in the UK](/blog/best-used-tractor-units-uk), which puts the DAF XF up against the Scania R, Volvo FH and Mercedes Actros.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell DAF XF tractor units?', answer: 'Yes, when they come in from UK fleets. Set up a free stock alert if you are waiting for a particular cab, axle layout or year.' },
      { question: 'Are DAF trucks good on fuel?', answer: 'DAF trucks are generally regarded as economical, but real fuel use depends on the spec, weight and how the truck is driven. We can share the service history where we have it.' },
      { question: 'Can I part exchange my DAF?', answer: 'Yes. We take DAFs and other makes in part exchange. Send the registration, mileage and photos for a valuation.' }
    ],
    guides: ['best-used-tractor-units-uk', 'euro-6-vs-euro-5-trucks', 'used-tractor-unit-buying-checklist']
  },
  {
    slug: 'scania',
    kind: 'make',
    name: 'Scania',
    make: 'Scania',
    filter: { make: 'Scania' },
    title: 'Used Scania Trucks for Sale UK | Midland Commercials',
    description: 'Used Scania trucks for sale: R and S series tractor units and P and G series rigids and tippers from UK fleets. Checked before sale, VAT and MOT shown.',
    heading: 'Used Scania Trucks for Sale',
    intro: 'Scania trucks are popular with UK owner-drivers and fleets for their strong engines, driver comfort and resale value. We sell used Scania R and S series tractor units and P and G series rigids and tippers, all checked before sale.',
    sections: [
      {
        heading: 'Scania Models Explained',
        paragraphs: [
          'The Scania R series is the classic long-haul tractor unit, and the S series has a flat floor and a bigger cab for drivers who spend nights out. The G series sits between long-haul and construction work, and the P series has a lower cab that suits distribution and tippers.',
          'Scania’s V8 engines have a loyal following, but most fleet units run the more economical 13-litre six-cylinder engines.'
        ]
      },
      {
        heading: 'Buying a Used Scania',
        paragraphs: [
          'Scanias tend to hold their value, so look closely at the service history and the mileage for the price. We check the cab, chassis, tyres and the Opticruise gearbox, and note any warning lights or known faults on the listing.',
          'We list the year, mileage, gearbox, cab type, VAT status, MOT and Euro rating on every advert. Our [used tractor unit buying checklist](/blog/used-tractor-unit-buying-checklist) explains what to check at a viewing.'
        ]
      },
      {
        heading: 'Scania vs Other Makes',
        paragraphs: [
          'If you are deciding between a Scania and a [DAF](/trucks/daf), [Volvo](/trucks/volvo) or [Mercedes-Benz](/trucks/mercedes-benz), our guide to the [best used tractor units in the UK](/blog/best-used-tractor-units-uk) compares running costs, comfort and resale.',
          'You can view any truck at our Swadlincote yard, Monday to Sunday, 8:00am to 6:00pm, or ask us for a walkaround video first.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell Scania V8 trucks?', answer: 'Occasionally. Most Scanias from UK fleets have six-cylinder engines. Set up a free stock alert if you are waiting for a V8.' },
      { question: 'What is the difference between a Scania R and S?', answer: 'Both are long-haul cabs. The S series has a completely flat floor and more interior space, while the R series has a small engine tunnel and a slightly lower cab.' },
      { question: 'Can I see a Scania on video before I travel?', answer: 'Yes. We can film a walkaround showing the engine starting, the cab interior, tyres and any known marks.' }
    ],
    guides: ['best-used-tractor-units-uk', 'used-tractor-unit-buying-checklist', 'clean-air-zones-hgv-guide']
  },
  {
    slug: 'volvo',
    kind: 'make',
    name: 'Volvo',
    make: 'Volvo',
    filter: { make: 'Volvo' },
    title: 'Used Volvo Trucks for Sale UK | Midland Commercials',
    description: 'Used Volvo trucks for sale: FH tractor units, FM and FMX rigids and tippers, and FL and FE distribution trucks from UK fleets, checked before sale.',
    heading: 'Used Volvo Trucks for Sale',
    intro: 'Volvo trucks have a strong reputation for safety, comfortable cabs and the smooth I-Shift gearbox. We sell used Volvo FH tractor units, FM and FMX rigids and tippers, and FL and FE distribution trucks from UK fleets.',
    sections: [
      {
        heading: 'Which Volvo Is Right for You?',
        paragraphs: [
          'The Volvo FH is the flagship long-haul tractor unit and one of the most popular trucks in the UK. The FM is a lower, lighter all-rounder for regional work, and the FMX is built for construction, with a stronger chassis and more ground clearance for site work. The FL and FE are the light and medium rigids for city distribution.'
        ]
      },
      {
        heading: 'What We Check on a Used Volvo',
        paragraphs: [
          'We go through the service history, check the I-Shift gearbox, the cab, chassis, tyres and brakes, and note the Euro rating and any warning lights. Volvos are known for good build quality, but high-mileage FHs still need careful checks of the clutch, suspension and air system.',
          'If you are comparing makes, our guide to the [best used tractor units in the UK](/blog/best-used-tractor-units-uk) puts the FH against the DAF XF, Scania R and Mercedes Actros.'
        ]
      },
      {
        heading: 'Safety and Clean Air Zones',
        paragraphs: [
          'Newer Volvos have good direct vision from the cab and safety systems such as lane-keeping and emergency braking. That helps with London’s Direct Vision Standard, explained in our [HGV safety permit guide](/blog/london-direct-vision-standard-hgv-safety-permit). Euro 6 Volvos also meet clean air zone rules across the UK.',
          'Browse our [tractor units](/trucks/tractor-units) and [tippers](/trucks/tippers), or set up a free stock alert for the Volvo you need.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell Volvo FH tractor units?', answer: 'Yes, when they come in from UK fleets. They sell quickly, so set up a free stock alert with the cab and axle layout you want.' },
      { question: 'Is the Volvo I-Shift gearbox reliable?', answer: 'I-Shift is widely used and generally well regarded. We check how it shifts and look for gearbox warnings before we list a truck.' },
      { question: 'Can I part exchange my Volvo?', answer: 'Yes. Send the registration, mileage and photos through our part exchange page for a valuation.' }
    ],
    guides: ['best-used-tractor-units-uk', 'london-direct-vision-standard-hgv-safety-permit', 'clean-air-zones-hgv-guide']
  },
  {
    slug: 'man',
    kind: 'make',
    name: 'MAN',
    make: 'MAN',
    filter: { make: 'MAN' },
    title: 'Used MAN Trucks for Sale UK | Midland Commercials',
    description: 'Used MAN trucks for sale: TGX tractor units, TGS tippers and TGL and TGM rigids from UK fleets. Checked before sale, with VAT, MOT and Euro rating shown.',
    heading: 'Used MAN Trucks for Sale',
    intro: 'MAN trucks offer good value, strong engines and a wide range for every job. We sell used MAN TGX tractor units, TGS tippers and heavy rigids, and TGL and TGM distribution trucks from UK fleets, each checked before sale.',
    sections: [
      {
        heading: 'The MAN Range',
        paragraphs: [
          'The MAN TGX is the long-haul tractor unit, with a spacious cab for nights out. The TGS is a heavier-duty truck that is very common as an 8x4 tipper or mixer on UK construction sites. The TGL (7.5 to 12 tonnes) and TGM (up to 26 tonnes) are rigids for local and regional distribution.',
          'Newer generation MANs have a redesigned cab and are more economical than older models, so check the year as well as the mileage.'
        ]
      },
      {
        heading: 'What We Check on a Used MAN',
        paragraphs: [
          'We go through the service history, check the TipMatic gearbox, the cab, chassis, tyres and brakes, and note the Euro rating. On tippers we also look at the body, the hydraulics and signs of hard site work. Anything worth knowing goes in the listing.',
          'Buying a tipper? Read our [used tipper truck buying guide](/blog/used-tipper-truck-buying-guide) before you view.'
        ]
      },
      {
        heading: 'Good Value for UK Operators',
        paragraphs: [
          'Used MANs often cost less than an equivalent Scania or Volvo, which makes them popular with operators starting out or adding to a fleet. Browse our [tippers](/trucks/tippers) and [rigids](/trucks/rigids), or view any truck at our Swadlincote yard, Monday to Sunday, 8:00am to 6:00pm.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell MAN TGS tippers?', answer: 'Yes, when they come in from UK fleets. Set up a free stock alert with the axle layout and body you need.' },
      { question: 'Are used MAN trucks reliable?', answer: 'A well-maintained MAN is a dependable truck. The service history matters more than the badge, so we share it with you where we have it.' },
      { question: 'Can I see a MAN truck on video?', answer: 'Yes. We can film a walkaround showing the engine starting, the cab and the bodywork before you travel.' }
    ],
    guides: ['used-tipper-truck-buying-guide', 'rigid-truck-vs-tractor-unit', 'euro-6-vs-euro-5-trucks']
  },
  {
    slug: 'iveco',
    kind: 'make',
    name: 'Iveco',
    make: 'Iveco',
    filter: { make: 'Iveco' },
    title: 'Used Iveco Trucks for Sale UK | Midland Commercials',
    description: 'Used Iveco trucks for sale: Eurocargo rigids for distribution and Stralis and S-Way tractor units from UK fleets. Checked before sale, VAT and MOT shown.',
    heading: 'Used Iveco Trucks for Sale',
    intro: 'Iveco is best known in the UK for the Eurocargo, one of the most popular medium rigids for local distribution. We sell used Iveco Eurocargo rigids and Stralis and S-Way tractor units from UK fleets, each checked before sale.',
    sections: [
      {
        heading: 'Iveco Eurocargo Rigids',
        paragraphs: [
          'The Eurocargo covers roughly 7.5 to 18 tonnes and is a favourite for multi-drop, builders merchants and local authority work. It is easy to drive in town, has a low cab for getting in and out at every drop, and comes with a wide choice of bodies, from curtainsiders and box vans to dropsides with tail lifts.',
          'See our full range of [used rigid trucks](/trucks/rigids) if you are open to other makes.'
        ]
      },
      {
        heading: 'Stralis and S-Way Tractor Units',
        paragraphs: [
          'The Iveco Stralis and its replacement, the S-Way, are long-haul tractor units. Some run on natural gas (LNG or CNG), which can reduce running costs and emissions for operators with access to refuelling. We note the fuel type on every listing.'
        ]
      },
      {
        heading: 'What We Check on a Used Iveco',
        paragraphs: [
          'We go through the service history, check the gearbox, cab, chassis, tyres and brakes, and on rigids we look at the body, curtains or box and any tail lift. Anything we find goes in the description, and we can send extra photos or a walkaround video.',
          'Our guide to [rigid trucks vs tractor units](/blog/rigid-truck-vs-tractor-unit) will help if you are not sure which suits your work. You can view any truck at our Swadlincote yard, Monday to Sunday, 8:00am to 6:00pm.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell Iveco Eurocargo 18 tonne rigids?', answer: 'Yes, when they come in from UK fleets. Set up a free stock alert with the weight, body and tail lift you need.' },
      { question: 'Do you sell gas-powered Iveco trucks?', answer: 'Occasionally. The fuel type is shown on every listing. Check you have access to LNG or CNG refuelling before you buy one.' },
      { question: 'Can I part exchange a van against an Iveco?', answer: 'Yes. We take vans, trucks and trailers in part exchange. Send the details through our part exchange page.' }
    ],
    guides: ['rigid-truck-vs-tractor-unit', 'starting-haulage-business-operator-licence', 'truck-part-exchange-guide']
  },
  {
    slug: 'mercedes-benz',
    kind: 'make',
    name: 'Mercedes-Benz',
    make: 'Mercedes-Benz',
    filter: { make: 'Mercedes-Benz' },
    match: (truck) => /mercedes/.test(lower(truck.make)),
    title: 'Used Mercedes-Benz Trucks for Sale UK | Midland',
    description: 'Used Mercedes-Benz trucks for sale: Actros tractor units, Arocs tippers and Atego and Antos rigids from UK fleets. Checked before sale, VAT and MOT shown.',
    heading: 'Used Mercedes-Benz Trucks for Sale',
    intro: 'Mercedes-Benz trucks are known for refined cabs, strong safety systems and good fuel economy. We sell used Actros tractor units, Arocs tippers and Atego and Antos rigids from UK fleets, each checked before sale.',
    sections: [
      {
        heading: 'The Mercedes-Benz Truck Range',
        paragraphs: [
          'The Actros is the long-haul tractor unit, with a choice of cab sizes and, on newer models, MirrorCam cameras in place of mirrors. The Arocs is built for construction, so it is common as a tipper, mixer or grab loader. The Atego is a light and medium rigid for distribution, and the Antos covers heavier regional work.'
        ]
      },
      {
        heading: 'What We Check on a Used Mercedes',
        paragraphs: [
          'We go through the service history, check the PowerShift gearbox, cab, chassis, tyres and brakes, and note the Euro rating and any warning lights. On Arocs tippers we also look at the body, hydraulics and signs of heavy site work.',
          'Comparing the Actros with other tractor units? Our guide to the [best used tractor units in the UK](/blog/best-used-tractor-units-uk) sets it against the DAF XF, Scania R and Volvo FH.'
        ]
      },
      {
        heading: 'Safety and Running Costs',
        paragraphs: [
          'Newer Mercedes-Benz trucks come with active braking and lane-keeping systems, which help with London’s Direct Vision Standard. Euro 6 models meet clean air zone rules across the UK. Browse our [tractor units](/trucks/tractor-units), [tippers](/trucks/tippers) and [rigids](/trucks/rigids), or view any truck at our Swadlincote yard, Monday to Sunday, 8:00am to 6:00pm.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell Mercedes Actros tractor units?', answer: 'Yes, when they come in from UK fleets. Set up a free stock alert with the cab and axle layout you need.' },
      { question: 'Do used Actros trucks have MirrorCam?', answer: 'Some newer Actros models do. It is listed in the description when the truck has it.' },
      { question: 'Can I view a Mercedes truck at the weekend?', answer: 'Yes. Our yard is open Monday to Sunday, 8:00am to 6:00pm. Call 0121 663 1118 before you travel.' }
    ],
    guides: ['best-used-tractor-units-uk', 'london-direct-vision-standard-hgv-safety-permit', 'used-tipper-truck-buying-guide']
  }
];

// Make pages match on the make name unless they define their own matcher.
categoryPages.forEach((page) => {
  if (!page.match && page.make) page.match = (truck) => lower(truck.make) === lower(page.make);
});

// Short link labels for the buying guides each page points to (slugs of the seeded blog posts).
export const guideTitles = {
  'euro-6-vs-euro-5-trucks': 'Euro 6 vs Euro 5 Trucks',
  'clean-air-zones-hgv-guide': 'Clean Air Zones: A Guide for HGV Operators',
  'used-tractor-unit-buying-checklist': 'Used Tractor Unit Buying Checklist',
  '4x2-vs-6x2-tractor-units': '4x2 vs 6x2 Tractor Units',
  'check-used-hgv-mot-history-paperwork': 'HGV MOT Check: How to Check a Truck’s MOT History',
  'truck-part-exchange-guide': 'How Truck Part Exchange Works',
  'hgv-road-user-levy-rates': 'HGV Road User Levy Rates',
  'london-direct-vision-standard-hgv-safety-permit': 'London Direct Vision Standard Guide',
  'used-tipper-truck-buying-guide': 'Used Tipper Truck Buying Guide',
  'best-used-tractor-units-uk': 'Best Used Tractor Units in the UK',
  'starting-haulage-business-operator-licence': 'Starting a Haulage Business',
  'rigid-truck-vs-tractor-unit': 'Rigid Truck vs Tractor Unit',
  'what-is-a-tractor-unit': 'What Is a Tractor Unit?',
  'grab-lorry-buying-guide': 'Grab Lorry Buying Guide',
  'hiab-crane-tractor-unit-buying-guide': 'HIAB and Crane Tractor Unit Buying Guide',
  'euro-6-truck-checklist-adblue-dpf': 'Euro 6 Truck Checklist: AdBlue and DPF'
};

export function categoryGuideLinks(page) {
  return (page.guides || []).filter((slug) => guideTitles[slug]).map((slug) => ({ label: guideTitles[slug], href: `/blog/${slug}` }));
}

/** Full listing on /trucks with this page's filter applied. */
export function categoryListingHref(page) {
  // Pages that match on keywords (grab, crane) have no single listing filter, so link to all stock.
  return page.filter ? `/trucks?${new URLSearchParams(page.filter).toString()}` : '/trucks';
}

export function categoryPath(page) {
  return `${CATEGORY_BASE_PATH}/${page.slug}`;
}

export function categoryForPath(pathname) {
  const match = String(pathname || '').match(/^\/trucks\/([a-z-]+)$/);
  return match ? categoryPages.find((page) => page.slug === match[1]) || null : null;
}

export function categoryForMake(make) {
  return categoryPages.find((page) => page.kind === 'make' && lower(page.make) === lower(make)) || null;
}

export function categoryLinks(kind) {
  return categoryPages
    .filter((page) => !kind || page.kind === kind)
    .map((page) => ({ label: page.heading, href: categoryPath(page) }));
}

/** Trucks from a stock list that belong on this page. */
export function categoryTrucks(page, trucks) {
  return (Array.isArray(trucks) ? trucks : []).filter((truck) => page.match(truck));
}
