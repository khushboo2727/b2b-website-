
const checkDomainAge = async (domain) => {
    try {
        console.log(`Checking ${domain}...`);
        // Using rdap.org like in the server code
        const res = await fetch(`https://rdap.org/domain/${domain}`, { headers: { 'Accept': 'application/rdap+json' } });

        if (!res.ok) {
            console.log(`RDAP lookup status: ${res.status}`);
            return null;
        }

        const data = await res.json();

        const events = data.events || [];
        const createdEvent = events.find(e => e.eventAction === 'registration') ||
            events.find(e => e.eventAction === 'last changed');

        if (createdEvent) {
            console.log(`Domain: ${domain}`);
            console.log(`Creation Date: ${createdEvent.eventDate}`);
            const age = (new Date() - new Date(createdEvent.eventDate)) / (1000 * 60 * 60 * 24 * 365.25);
            console.log(`Approx Age: ${age.toFixed(2)} years`);
            const isOldEnough = age > 0.5;
            console.log(`Is > 6 months old? ${isOldEnough}`);
        } else {
            console.log('No creation date found in events:', events);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
};

checkDomainAge('niryatbusiness.com');
