```javascript
function showBooking() {
    document.getElementById("booking").scrollIntoView({
        behavior: "smooth"
    });
}

function submitBooking(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const car = document.getElementById("car").value;
    const service = document.getElementById("service").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    const message = `🚗 GLS Car Wash - New Booking

👤 Name: ${name}
📞 Phone: ${phone}
🚘 Car: ${car}
🧼 Service: ${service}
📅 Date: ${date}
⏰ Time: ${time}`;

    const whatsappNumber = "60128500418";

    const whatsappURL =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.location.href = whatsappURL;
}
```
