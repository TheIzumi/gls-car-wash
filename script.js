```javascript
function showBooking() {
    document.getElementById("booking").scrollIntoView({
        behavior: "smooth"
    });
}

function submitBooking(event) {
    event.preventDefault();

    var name = document.getElementById("name").value;
    var phone = document.getElementById("phone").value;
    var car = document.getElementById("car").value;
    var service = document.getElementById("service").value;
    var date = document.getElementById("date").value;
    var time = document.getElementById("time").value;

    var message =
        "GLS Car Wash - New Booking\n\n" +
        "Name: " + name + "\n" +
        "Phone: " + phone + "\n" +
        "Car: " + car + "\n" +
        "Service: " + service + "\n" +
        "Date: " + date + "\n" +
        "Time: " + time;

    var whatsappNumber = "60128500418";

    var whatsappURL =
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(message);

    window.location.href = whatsappURL;
}
