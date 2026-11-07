// Area landing pages ("Used Trucks For Sale in <place>"). Shared by the client page, the
// server-rendered HTML and the sitemap, so every crawler sees the full text without JavaScript.
// Keep each page's copy unique — do not copy paragraphs between areas.

export const LOCATION_BASE_PATH = '/used-trucks-for-sale';

export const locationPages = [
  {
    slug: 'derby',
    place: 'Derby',
    title: 'Used Trucks for Sale in Derby | Midland Commercials',
    description: 'Used trucks for sale near Derby. Tractor units, rigids and tippers with clear VAT, MOT and Euro details at our Swadlincote yard. Part exchange welcome.',
    heading: 'Used Trucks for Sale in Derby',
    intro: 'Looking for a used truck near Derby? Midland Commercials is a short run down the road from the city, with checked tractor units, rigids, tippers and trailers ready to view seven days a week.',
    sections: [
      {
        heading: 'A Local Truck Dealer for Derby Operators',
        paragraphs: [
          'Derby has a long history of making and moving things. Car plants, aerospace suppliers, rail engineering and the warehouses that feed them all rely on a steady flow of trucks, and many of the hauliers serving them are small firms or owner-drivers who cannot afford a vehicle that lets them down. That is the customer we built Midland Commercials around.',
          'Our yard sits at Little Wigston, Swadlincote (DE12 7BJ), close to the A42 and M42. For most Derby businesses that is an easy trip, so you can come and look over a truck in person, sit in the cab and check the paperwork before you commit. If you would rather not travel, we can send extra photos or film a walkaround video and talk you through it on the phone.'
        ]
      },
      {
        heading: 'Trucks That Suit Derby Work',
        paragraphs: [
          'The work around Derby is varied, so our stock is too. Operators running parts and components to manufacturing sites often want a reliable tractor unit with a sleeper cab and a good service history. Local distribution firms tend to look for 18 tonne and 26 tonne rigids with curtainside or box bodies, often with a tail lift for multi-drop work. Builders and groundworks contractors around the city\'s housing developments usually ask for tippers and grab loaders.',
          'We stock popular makes including DAF, Scania, Volvo, MAN, Mercedes-Benz, Iveco and Renault. Every listing shows the year, mileage, gearbox, cab type, VAT status, MOT and Euro rating, so you can shortlist trucks from your desk before picking up the phone.'
        ]
      },
      {
        heading: 'Checked Before Sale, Described Honestly',
        paragraphs: [
          'Every truck we sell is checked over before it goes on the website. We note tyre condition, look at the cab and bodywork, go through the service history and tell you about anything we find. We would rather you know about a worn seat or a chipped panel before you arrive than be disappointed on the day.',
          'If a truck is not right for the job you describe, we will say so and suggest something that fits better. Most of our customers come back when they need their next vehicle, and that only happens if the first one was described properly.'
        ]
      },
      {
        heading: 'Part Exchange Your Current Truck',
        paragraphs: [
          'Plenty of Derby operators are replacing an older Euro 5 truck with a Euro 6 model. We take trucks, vans and trailers in part exchange, which saves you the time and hassle of selling privately. Send us the registration, mileage, MOT date and a few photos through our [part exchange page](/part-exchange) and we will come back with a valuation against the truck you want.'
        ]
      },
      {
        heading: 'Buying from Us If You Are Based in Derby',
        paragraphs: [
          'Start by browsing our [current used trucks for sale](/trucks), or set up a stock alert if you are waiting for a particular make or body type. When something catches your eye, call us on 0121 663 1118 or send an enquiry and we will confirm availability, VAT status and any extra details you need.',
          'Viewings are available Monday to Sunday, 8:00am to 6:00pm. Once you are happy, a deposit holds the truck while we finish the paperwork, and we will agree a handover time that works around your schedule. You can read our [buying FAQs](/faq) for more on reservations, VAT and paperwork.'
        ]
      }
    ],
    faqs: [
      { question: 'How far is your yard from Derby?', answer: 'Our yard at Little Wigston, Swadlincote is south of Derby, near the M42 and A42. Most Derby customers find it an easy trip, and we will give you directions when we book your viewing.' },
      { question: 'Do you sell trucks with tail lifts for Derby multi-drop work?', answer: 'Yes. Curtainside and box rigids with tail lifts come through regularly. Set up a stock alert with the weight and body you need and we will tell you when one arrives.' },
      { question: 'Can I see a truck on video before I travel from Derby?', answer: 'Yes. We can film a walkaround video showing the engine starting, the cab, tyres and bodywork, so you can decide before you make the trip to our yard.' }
    ]
  },
  {
    slug: 'leicester',
    place: 'Leicester',
    title: 'Used Trucks for Sale in Leicester | Midland Commercials',
    description: 'Used trucks for sale near Leicester and Leicestershire. Rigids, tractor units and tippers with clear VAT and MOT details. Viewings 7 days a week.',
    heading: 'Used Trucks for Sale in Leicester',
    intro: 'Midland Commercials is based in North West Leicestershire, so for Leicester hauliers, distributors and builders we are a local dealer, not a long drive. Browse checked used trucks and arrange a viewing any day of the week.',
    sections: [
      {
        heading: 'Leicestershire\'s Logistics Country',
        paragraphs: [
          'Leicestershire sits right in the middle of the UK road network. With the M1, M69 and A42 on the doorstep and large distribution parks such as Magna Park near Lutterworth, the county is home to a huge number of warehouses and the trucks that serve them. Food, retail and parcel distribution keep thousands of vehicles busy every day.',
          'That makes reliability the first thing Leicester operators ask about. A truck that is off the road costs money in missed deliveries and hire vehicles, so we focus on stock with a clear history and an honest description of its condition.'
        ]
      },
      {
        heading: 'The Right Truck for Distribution and Trade',
        paragraphs: [
          'For trunking work between distribution centres, a Euro 6 tractor unit with a sleeper or high-roof cab is the usual choice, and we regularly stock 4x2 and 6x2 units from DAF, Scania, Volvo and MAN. For deliveries into Leicester city centre and the surrounding towns, smaller rigids are often more practical, with 7.5 tonne, 12 tonne and 18 tonne trucks easier to manoeuvre and to park.',
          'Builders and landscapers across Leicestershire also buy tippers from us, from compact rigid tippers for domestic jobs to 8x4 tippers for muck-away and aggregate work. Whatever you need, our [used truck listings](/trucks) can be filtered by make, body type and price.'
        ]
      },
      {
        heading: 'Clear Prices and VAT Status',
        paragraphs: [
          'Accounts teams want to know exactly what they are paying for. Every one of our listings shows whether the price is plus VAT, VAT included or no VAT, and we confirm the final position on the invoice before you pay. You will also see the MOT status and Euro rating, which matters if your routes take you into any clean air zone.',
          'Fleet buyers in Leicester often purchase more than one vehicle at a time. If you are looking for a matching pair of rigids or several units for a new contract, tell us what you need and we will let you know what is in stock and what is arriving soon.'
        ]
      },
      {
        heading: 'Trade In Your Old Vehicle',
        paragraphs: [
          'Part exchange is a simple way to move on an older truck, van or trailer without the time it takes to advertise and sell it yourself. Our team looks at the registration, mileage, service history and photos you send and gives you a fair valuation against your next truck. Start on our [part exchange page](/part-exchange).'
        ]
      },
      {
        heading: 'Visit Our Yard from Leicester',
        paragraphs: [
          'Our yard is at Little Wigston, Swadlincote (DE12 7BJ), in the north west of the county, and is open Monday to Sunday, 8:00am to 6:00pm. We prepare the truck and its paperwork before you arrive so you can inspect it properly, ask questions and take it for a look around the yard.',
          'If you cannot get over in person, we can arrange a video walkaround and hold the truck after final checks and an agreed deposit. Call 0121 663 1118, or read our [buying guides](/blog) for advice on choosing your next truck.'
        ]
      }
    ],
    faqs: [
      { question: 'Are you near Leicester?', answer: 'Yes. We are in North West Leicestershire, at Little Wigston, Swadlincote (DE12 7BJ), so for most Leicester businesses we are a local dealer rather than a long drive.' },
      { question: 'Can I buy more than one truck for a new contract?', answer: 'Yes. Tell us how many vehicles you need, the body type and your budget, and we will let you know what is in stock now and what is due in soon.' },
      { question: 'Do you show whether prices include VAT?', answer: 'Every listing shows whether the price is plus VAT, VAT included or no VAT, and the final VAT position is confirmed on the invoice before you pay.' }
    ]
  },
  {
    slug: 'birmingham',
    place: 'Birmingham',
    title: 'Used Trucks for Sale in Birmingham | Midland Commercials',
    description: 'Used trucks for sale near Birmingham. Euro 6 tractor units, rigids and tippers ready for the Clean Air Zone, with VAT and MOT shown on every listing.',
    heading: 'Used Trucks for Sale in Birmingham',
    intro: 'Birmingham operators can reach our Swadlincote yard straight up the M42. We sell checked used tractor units, rigids and tippers, with the Euro rating shown on every listing so you know where you stand with the Clean Air Zone.',
    sections: [
      {
        heading: 'Serving the West Midlands from Up the M42',
        paragraphs: [
          'Birmingham is one of the busiest freight hubs in the country. The M5, M6 and M42 meet around the city, and a large share of UK distribution passes through the West Midlands every day. Add a construction sector that never seems to slow down, and you get a constant demand for good, honest used trucks.',
          'Our yard is at Little Wigston, Swadlincote (DE12 7BJ), close to junction 11 of the M42. For most Birmingham businesses that means a straightforward motorway run to come and see a truck before buying.'
        ]
      },
      {
        heading: 'Clean Air Zone Ready Trucks',
        paragraphs: [
          'Birmingham runs a charging Clean Air Zone inside the A4540 Middleway ring road. Heavy goods vehicles that do not meet the Euro VI standard pay a daily charge to drive inside it, so if any of your work takes you into the city centre, a compliant truck quickly pays for itself.',
          'Every listing on our site shows the Euro rating, and most of our stock is Euro 6. Before you buy, always check the registration on the government vehicle checker for the zone, as the rules can change. Our guide to [Euro 6 vs Euro 5 trucks](/blog/euro-6-vs-euro-5-trucks) explains the difference in more detail.'
        ]
      },
      {
        heading: 'Trucks for Haulage, Distribution and Construction',
        paragraphs: [
          'Long-distance hauliers from the West Midlands usually look for Euro 6 tractor units with sleeper cabs, automated gearboxes and a full service history. Multi-drop and retail distribution firms ask for curtainside and box rigids, often with a tail lift. Construction, demolition and groundworks contractors working on Birmingham\'s many building sites buy tippers and grab loaders.',
          'For city work, think about size as well as emissions. A 7.5 tonne or 12 tonne rigid is far easier to manoeuvre through Birmingham\'s inner-city streets and loading bays, while a 26 tonne rigid or an artic makes more sense for out-of-town distribution parks. If you are not sure which is right for a new contract, tell us about the work and we will point you towards the trucks that suit it.',
          'We stock all of these, from makes such as DAF, Scania, Volvo, MAN, Mercedes-Benz, Iveco and Renault. Browse our [current trucks for sale](/trucks) and filter by body type, make and price to build your shortlist.'
        ]
      },
      {
        heading: 'No Pressure, No Surprises',
        paragraphs: [
          'We check every truck before it is listed and describe it as we find it, including the small marks and wear you would expect on a working vehicle. You get extra photos or a walkaround video on request, and we are always happy to answer questions before you make the trip.',
          'If you have an older truck that cannot go into the Clean Air Zone, we can take it in [part exchange](/part-exchange) against a compliant one, which makes the switch to Euro 6 simpler.'
        ]
      },
      {
        heading: 'Arrange a Viewing',
        paragraphs: [
          'We are open Monday to Sunday, 8:00am to 6:00pm. Call 0121 663 1118 or send an enquiry from any truck listing, and we will confirm availability and VAT status and book a time for you to come and see it. Our [FAQs](/faq) cover reservations, deposits and paperwork.'
        ]
      }
    ],
    faqs: [
      { question: 'Are your trucks compliant with the Birmingham Clean Air Zone?', answer: 'Most of our stock is Euro 6, and the Euro rating is shown on every listing. Always check the registration on the official vehicle checker before driving into the zone.' },
      { question: 'How do I get to your yard from Birmingham?', answer: 'Head north east on the M42 towards junction 11. Our yard is at Little Wigston, Swadlincote, DE12 7BJ, and we send directions when we confirm your viewing.' },
      { question: 'Can I part exchange a Euro 5 truck?', answer: 'Yes. We take older trucks in part exchange, including Euro 5 vehicles that can no longer go into the Clean Air Zone without paying a charge.' }
    ]
  },
  {
    slug: 'nottingham',
    place: 'Nottingham',
    title: 'Used Trucks for Sale in Nottingham | Midland Commercials',
    description: 'Used trucks for sale near Nottingham. Tippers, rigids and tractor units checked before sale, with clear VAT, MOT and Euro details. Part exchange welcome.',
    heading: 'Used Trucks for Sale in Nottingham',
    intro: 'From tippers for Nottinghamshire\'s building sites to tractor units for M1 trunking, Midland Commercials supplies checked used trucks to Nottingham operators, with viewings at our yard seven days a week.',
    sections: [
      {
        heading: 'Trucks for Nottinghamshire Businesses',
        paragraphs: [
          'Nottingham sits on the M1 corridor, with easy links north to Yorkshire and south to London. That puts the city and its surrounding towns in a strong position for haulage and distribution, while house building, road schemes and quarrying across Nottinghamshire keep a large fleet of tippers and construction vehicles busy.',
          'Many of the businesses we deal with around Nottingham are family firms and owner-drivers who know exactly what they want from a truck. Others are growing fleets that need a reliable extra vehicle quickly to cover a new contract. Either way, we aim to give you straight answers, accurate descriptions and a fair price, without the hard sell.',
          'Our yard at Little Wigston, Swadlincote (DE12 7BJ) is reached easily via the A42 and M1, so it is a practical place for Nottingham operators to come and see a truck in person before buying.'
        ]
      },
      {
        heading: 'Tippers and Construction Vehicles',
        paragraphs: [
          'A large share of our Nottingham customers work in construction and aggregates. For that work we stock 6x4 and 8x4 tippers, grab loaders and rigid tippers from DAF, Volvo, Scania, MAN and Mercedes-Benz. We look closely at the body, the tipping gear, the chassis and the tyres before listing them, because these trucks work hard and the condition of the body matters as much as the engine.',
          'If you need a particular body, such as an insulated tipper for asphalt or an 8x4 with a specific bed length, tell us and we will let you know when a suitable truck arrives.'
        ]
      },
      {
        heading: 'Tractor Units and Rigids for the M1 Corridor',
        paragraphs: [
          'Hauliers based around Nottingham often run trunking work up and down the M1. For that, a Euro 6 tractor unit with a comfortable sleeper cab, an automated gearbox and a good service history is the usual choice. Local and regional distributors tend to buy 18 tonne and 26 tonne rigids with curtainside or box bodies.',
          'Every listing on our [used trucks page](/trucks) shows the mileage, gearbox, cab type, VAT status, MOT and Euro rating, so you can compare trucks properly before you call.'
        ]
      },
      {
        heading: 'Fair Part Exchange Valuations',
        paragraphs: [
          'Construction vehicles take a beating, and many Nottingham operators come to us when an older tipper is due for replacement. We take tippers, rigids, tractor units, vans and trailers in part exchange. Send the registration, mileage, condition notes and photos through our [part exchange form](/part-exchange) for a valuation against your next truck.'
        ]
      },
      {
        heading: 'How to Buy from Nottingham',
        paragraphs: [
          'Shortlist a truck online, then call 0121 663 1118 or send an enquiry. We confirm availability, VAT status and any extra details, and send more photos or a walkaround video if you want them. Viewings run Monday to Sunday, 8:00am to 6:00pm, and a deposit will hold the truck while the paperwork is finished.',
          'Not sure what to buy? Our [truck buying guides](/blog) cover emissions standards, inspections and running costs, and our [FAQs](/faq) answer the most common questions about buying from us.'
        ]
      }
    ],
    faqs: [
      { question: 'Do you sell 8x4 tippers?', answer: 'Yes. 8x4 and 6x4 tippers are among our most popular trucks with Nottinghamshire buyers. Set up a stock alert if you need a particular body or bed length.' },
      { question: 'How do I get to your yard from Nottingham?', answer: 'Our yard at Little Wigston, Swadlincote is reached via the M1 and A42. We send full directions when we book your viewing.' },
      { question: 'Can I see a video of a truck before I travel?', answer: 'Yes. We can film a walkaround video and send extra photos of the body, chassis, tyres and cab so you can decide before making the trip.' }
    ]
  },
  {
    slug: 'east-midlands',
    place: 'East Midlands',
    title: 'Used Trucks for Sale in the East Midlands | Midland Commercials',
    description: 'East Midlands used truck dealer near the M1, M42 and A42. Tractor units, rigids, tippers and trailers with clear VAT and MOT details. Open 7 days.',
    heading: 'Used Trucks for Sale in the East Midlands',
    intro: 'Midland Commercials is an independent used truck dealer in the East Midlands, at Little Wigston, Swadlincote. We supply checked tractor units, rigids, tippers and trailers to operators across Leicestershire, Derbyshire, Nottinghamshire and beyond.',
    sections: [
      {
        heading: 'At the Centre of the UK Road Network',
        paragraphs: [
          'The East Midlands is often described as part of the UK\'s logistics "golden triangle", the area where most of the country\'s population can be reached within a few hours by truck. The M1, M42, A42, A50 and A1 all pass through the region, and sites such as East Midlands Airport and the East Midlands Gateway rail freight terminal handle huge volumes of goods.',
          'Our yard is close to junction 11 of the M42, where it becomes the A42. That puts us within easy reach of Derby, Leicester, Nottingham, Burton upon Trent, Loughborough, Coalville, Tamworth and the surrounding towns.',
          'Being central also helps when you are buying. You can view a truck in the morning and still be back at your depot in the afternoon, and if you are collecting a truck from further afield, the motorway links make the journey home straightforward.'
        ]
      },
      {
        heading: 'What We Sell',
        paragraphs: [
          'Our stock covers most of what regional operators need. That includes 4x2 and 6x2 tractor units for general haulage and trunking, rigids from 7.5 tonnes to 26 tonnes for distribution and multi-drop work, and tippers and grab loaders for construction and aggregates. We also stock trailers.',
          'We buy direct from UK fleets and operators, so most trucks come with known service histories. Popular makes include DAF, Scania, Volvo, MAN, Mercedes-Benz, Iveco and Renault. You can see everything currently available on our [used trucks for sale page](/trucks).'
        ]
      },
      {
        heading: 'Why East Midlands Operators Buy from Us',
        paragraphs: [
          'We keep things simple. Every truck is checked before it is listed, every advert shows the details that matter, and the price you see comes with a clear VAT status. If there is something you should know about a vehicle, we tell you before you travel, not when you arrive.',
          'Because we are local, you can come and see a truck in person at a time that suits you. We are open Monday to Sunday, 8:00am to 6:00pm, which suits owner-drivers and small fleets who cannot take a weekday off the road.'
        ]
      },
      {
        heading: 'Areas We Cover',
        paragraphs: [
          'Most of our customers are within an hour or so of the yard, and we have dedicated pages for buyers in [Derby](/used-trucks-for-sale/derby), [Leicester](/used-trucks-for-sale/leicester), [Nottingham](/used-trucks-for-sale/nottingham) and [Birmingham](/used-trucks-for-sale/birmingham). We also sell to operators across the rest of the UK, many of whom reserve a truck after a video walkaround and travel to collect it.'
        ]
      },
      {
        heading: 'Part Exchange and Next Steps',
        paragraphs: [
          'If you have a truck, van or trailer to move on, we can take it in [part exchange](/part-exchange) against your next vehicle. Send the registration, mileage and some photos and we will come back with a valuation.',
          'Ready to talk? Call 0121 663 1118, email sales@midlandcommercials.com or [send us a message](/contact). We aim to reply to every enquiry the same day.'
        ]
      }
    ],
    faqs: [
      { question: 'Where in the East Midlands are you based?', answer: 'Our yard is at Little Wigston, Swadlincote, DE12 7BJ, in North West Leicestershire, close to junction 11 of the M42 where it joins the A42.' },
      { question: 'Do you only sell to East Midlands operators?', answer: 'No. Most of our customers are in the Midlands, but we sell to operators all over the UK, and many reserve a truck after a video walkaround.' },
      { question: 'When can I view a truck?', answer: 'We are open Monday to Sunday, 8:00am to 6:00pm. Call 0121 663 1118 to book a time and we will have the truck and its paperwork ready.' }
    ]
  }
];

export function locationPath(location) {
  return `${LOCATION_BASE_PATH}/${location.slug}`;
}

export function locationForPath(pathname) {
  const match = String(pathname || '').match(/^\/used-trucks-for-sale\/([a-z-]+)$/);
  return match ? locationPages.find((location) => location.slug === match[1]) || null : null;
}

export function locationLinks() {
  return locationPages.map((location) => ({ label: `Used Trucks ${location.slug === 'east-midlands' ? 'in the' : 'in'} ${location.place}`, href: locationPath(location) }));
}
