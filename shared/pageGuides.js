// Extra guide copy for the main pages (trucks, part exchange, contact, about, blog).
// Shared by the React pages and the server-rendered HTML, so visitors and crawlers see the
// same text. Links use the blog format: [text](/path). Keep every fact here in line with the
// rest of the site (yard address, hours, phone, services offered).

export const pageGuides = {
  trucks: {
    eyebrow: 'Buying Advice',
    heading: 'How to Choose the Right Used Truck',
    sections: [
      {
        heading: 'Tractor Units, Rigids, Tippers and Trailers',
        paragraphs: [
          'Most of our stock falls into four groups. Tractor units pull trailers on trunking, general haulage and container work, and usually come with a sleeper cab for nights out. Rigids, from 7.5 tonnes up to 26 tonnes and beyond, carry their own body and suit local distribution, multi-drop and specialist work. Tippers and grab loaders serve builders, groundworks and aggregates firms, and trailers complete the set for operators who already run their own units.',
          'If you are unsure which layout fits the job, our guide to [rigid trucks vs tractor units](/blog/rigid-truck-vs-tractor-unit) explains the trade-offs, and the [used tipper buying guide](/blog/used-tipper-truck-buying-guide) covers what to look for on construction vehicles.'
        ]
      },
      {
        heading: 'What Every Listing Tells You',
        paragraphs: [
          'Each advert shows the year, mileage, gearbox, cab type, VAT status, MOT and Euro rating, so you can compare trucks from your desk before you pick up the phone. The VAT line tells you whether the price is plus VAT, includes VAT or carries no VAT, and the final status is confirmed on the invoice before payment.',
          'The Euro rating matters more every year as clean air and low emission zones spread. Read [Euro 6 vs Euro 5 trucks](/blog/euro-6-vs-euro-5-trucks) and our [clean air zones guide](/blog/clean-air-zones-hgv-guide) before you choose, and check the [London Direct Vision Standard](/blog/london-direct-vision-standard-hgv-safety-permit) if you deliver into the capital.'
        ]
      },
      {
        heading: 'Checking a Truck Before You Buy',
        paragraphs: [
          'Look at the service history, MOT history, tyre condition, cab and bodywork, and make sure the VIN matches the V5C. We go through all of this with you at the viewing, and our [used tractor unit buying checklist](/blog/used-tractor-unit-buying-checklist) and guide to [checking MOT history and paperwork](/blog/check-used-hgv-mot-history-paperwork) show you exactly what to ask.',
          'Remember to budget for running costs too, including the [HGV Road User Levy](/blog/hgv-road-user-levy-rates), insurance and tyres.'
        ]
      },
      {
        heading: 'Viewing, Reserving and Buying',
        paragraphs: [
          'Our yard at Little Wigston, Swadlincote, DE12 7BJ is open Monday to Sunday, 8:00am to 6:00pm. Call 0121 663 1118 before you travel and we will have the truck and its paperwork ready. If you are further away, we can send extra photos or a walkaround video and hold the truck with an agreed deposit once availability is confirmed.',
          'Have a vehicle to move on? We take trucks, vans and trailers in [part exchange](/part-exchange). For more on reservations, VAT and paperwork, see our [buying FAQs](/faq).'
        ]
      }
    ],
    faqs: [
      { question: 'How often does new stock arrive?', answer: 'New trucks arrive every week. If you are waiting for a particular make, body or budget, set up a free stock alert and we will tell you as soon as a match comes in.' },
      { question: 'Can I see a truck on video before I travel?', answer: 'Yes. We can film a walkaround showing the engine starting, the cab, tyres and bodywork, and talk you through it on the phone.' },
      { question: 'Which makes do you sell?', answer: 'We regularly stock DAF, Scania, Volvo, MAN, Mercedes-Benz, Iveco and Renault, as well as trailers.' }
    ]
  },

  partExchange: {
    eyebrow: 'How It Works',
    heading: 'Part Exchange Your Truck, Van or Trailer',
    sections: [
      {
        heading: 'A Simple Process',
        list: [
          'Send us the registration, mileage, MOT date, condition notes and a few photos using the form above.',
          'Our team reviews the details and gets back to you, usually the same day, with any questions.',
          'We give you a valuation against the truck you want to buy, so you can see the real cost of changing.',
          'When you collect your next truck, we confirm the figure once we have seen your vehicle and checked it matches the details and photos you sent.'
        ]
      },
      {
        heading: 'What We Take in Part Exchange',
        paragraphs: [
          'We take trucks, vans and trailers in part exchange. That includes tractor units, rigids of all weights, tippers and curtainside or box trailers. Selling privately takes time, means answering calls from buyers who never turn up and leaves you without a vehicle while you wait. Part exchange lets you hand over your old vehicle when you collect the replacement, with one deal and one set of paperwork.'
        ]
      },
      {
        heading: 'How to Get a Better Valuation',
        paragraphs: [
          'The more we know, the more accurate the figure. A full service history, a current MOT, decent tyres and a clean cab all help. Clear photos of each side, the cab interior, the tyres and any damage save repeated calls and let us value the vehicle properly before you visit.',
          'Our [truck part exchange guide](/blog/truck-part-exchange-guide) explains what affects value, and if you are moving from an older Euro 5 vehicle, read [Euro 6 vs Euro 5 trucks](/blog/euro-6-vs-euro-5-trucks) to see what the upgrade could save you.'
        ]
      },
      {
        heading: 'Choose Your Next Truck',
        paragraphs: [
          'Browse our [used trucks for sale](/trucks) to find the replacement, or call 0121 663 1118 and tell us what you need. Our yard at Little Wigston, Swadlincote is open seven days a week for viewings.'
        ]
      }
    ],
    faqs: [
      { question: 'What details do you need for a valuation?', answer: 'The registration, current mileage, MOT date, condition notes and photos of the cab, body and tyres. Service history helps too.' },
      { question: 'Can I part exchange a van or a trailer?', answer: 'Yes. We take trucks, vans and trailers in part exchange against your next vehicle.' },
      { question: 'How quickly will I hear back?', answer: 'We aim to reply to every valuation request the same day during our opening hours, Monday to Sunday, 8:00am to 6:00pm.' }
    ]
  },

  contact: {
    eyebrow: 'Before You Visit',
    heading: 'Visiting Our Swadlincote Yard',
    sections: [
      {
        heading: 'Finding Us',
        paragraphs: [
          'Our sales yard is at Little Wigston, Swadlincote, DE12 7BJ, close to junction 11 of the M42 where it joins the A42. It is an easy trip from [Derby](/used-trucks-for-sale/derby), [Leicester](/used-trucks-for-sale/leicester), [Nottingham](/used-trucks-for-sale/nottingham), Burton upon Trent and [Birmingham](/used-trucks-for-sale/birmingham), and we serve operators right across the [East Midlands](/used-trucks-for-sale/east-midlands).',
          'We are open Monday to Sunday, 8:00am to 6:00pm. Please call before you travel so we can have the truck you want to see, and its paperwork, ready when you arrive.'
        ]
      },
      {
        heading: 'What to Include in Your Enquiry',
        list: [
          'The truck you are interested in, or the make, body type and budget you are looking for.',
          'How you will use it, for example trunking, multi-drop or construction work.',
          'Whether you are VAT registered, so we can confirm the right price.',
          'Details of any vehicle you want to [part exchange](/part-exchange).'
        ]
      },
      {
        heading: 'Buying from Further Away',
        paragraphs: [
          'Not everyone can get to the yard straight away. We can send extra photos, film a walkaround video and answer questions by phone or email. Once you are happy, an agreed deposit holds the truck while we finish the paperwork. Our [buying FAQs](/faq) cover reservations, VAT and what to check, and you can browse every truck we have in stock on our [used trucks page](/trucks).'
        ]
      }
    ]
  },

  about: {
    eyebrow: 'What We Do',
    heading: 'A Used Truck Dealer Built Around Operators',
    sections: [
      {
        heading: 'Who We Supply',
        paragraphs: [
          'Our customers range from owner-drivers buying their first truck to hauliers adding to a fleet, and from builders who need a tipper to distribution firms looking for rigids with tail lifts. Whatever the size of the business, the questions are the same: will the truck do the job, what will it cost to run, and is it what the advert says it is? We answer those honestly.'
        ]
      },
      {
        heading: 'How We Source and Check Our Trucks',
        paragraphs: [
          'We buy tractor units, rigids, tippers and trailers direct from UK fleets and operators. Before a truck goes on the website we look at the tyres, cab, bodywork and service history and note anything you should know about. If a truck is not right for the work you describe, we will tell you and suggest something that fits better.',
          'New stock arrives every week, with makes including DAF, Scania, Volvo, MAN, Mercedes-Benz, Iveco and Renault. See what is on the yard today on our [used trucks for sale](/trucks) page.'
        ]
      },
      {
        heading: 'Help Choosing Your Next Truck',
        paragraphs: [
          'We publish free guides for UK operators. Popular reads include the [best used tractor units in the UK](/blog/best-used-tractor-units-uk), [4x2 vs 6x2 tractor units](/blog/4x2-vs-6x2-tractor-units) and, if you are setting up on your own, [starting a haulage business and getting an operator licence](/blog/starting-haulage-business-operator-licence). Browse every article on our [guides page](/blog).'
        ]
      }
    ]
  },

  blog: {
    eyebrow: 'Start Here',
    heading: 'Popular Guides by Topic',
    sections: [
      {
        heading: 'Buying a Used Truck',
        list: [
          '[Used tractor unit buying checklist](/blog/used-tractor-unit-buying-checklist): what to inspect before you pay.',
          '[How to check MOT history and paperwork](/blog/check-used-hgv-mot-history-paperwork): spotting gaps and mismatches.',
          '[Best used tractor units in the UK](/blog/best-used-tractor-units-uk): the makes and models operators trust.',
          '[Used tipper buying guide](/blog/used-tipper-truck-buying-guide): bodies, hydraulics and wear points.',
          '[Rigid truck vs tractor unit](/blog/rigid-truck-vs-tractor-unit) and [4x2 vs 6x2 tractor units](/blog/4x2-vs-6x2-tractor-units): choosing the right layout.'
        ]
      },
      {
        heading: 'Rules, Emissions and Running Costs',
        list: [
          '[Euro 6 vs Euro 5 trucks](/blog/euro-6-vs-euro-5-trucks): what the upgrade really changes.',
          '[Clean air zones for HGVs](/blog/clean-air-zones-hgv-guide): where you may be charged and how to check.',
          '[London Direct Vision Standard](/blog/london-direct-vision-standard-hgv-safety-permit): the HGV safety permit explained.',
          '[HGV Road User Levy rates](/blog/hgv-road-user-levy-rates): what you pay and when.'
        ]
      },
      {
        heading: 'Running and Growing a Haulage Business',
        list: [
          '[Starting a haulage business and getting an operator licence](/blog/starting-haulage-business-operator-licence).',
          '[Truck part exchange guide](/blog/truck-part-exchange-guide): getting a fair price for your old vehicle.'
        ]
      },
      {
        paragraphs: [
          'Ready to look at stock? Browse our [used trucks for sale](/trucks), read the [buying FAQs](/faq) or [contact the team](/contact) at our Swadlincote yard, open seven days a week.'
        ]
      }
    ]
  }
};
