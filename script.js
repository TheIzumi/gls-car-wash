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

    const message =
        "🚗 *GLS Car Wash - New Booking*%0A%0A" +
        "👤 Name: " + name + "%0A" +
        "📞 Phone: " + phone + "%0A" +
        "🚘 Car: " + car + "%0A" +
        "🧼 Service: " + service + "%0A" +
        "📅 Date: " + date + "%0A" +
        "⏰ Time: " + time;

    const whatsappNumber = "60107795202";

    const whatsappURL =
        "https://wa.me/" + whatsappNumber + "?text=" + message;

    window.open(whatsappURL, "_blank");
}
```
