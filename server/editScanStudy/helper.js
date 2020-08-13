module.exports = {
    formatDate: function (date) {
        if (date) {
            var yyyy = date.getUTCFullYear();
            var dd = date.getUTCDate();
            var mm = (date.getUTCMonth() + 1);

            if (dd < 10)
                dd = "0" + dd;

            if (mm < 10)
                mm = "0" + mm;

            var cur_day = yyyy + "-" + mm + "-" + dd;

            var hours = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            var seconds = date.getUTCSeconds();

            if (hours < 10)
                hours = "0" + hours;

            if (minutes < 10)
                minutes = "0" + minutes;

            if (seconds < 10)
                seconds = "0" + seconds;
            return cur_day + " " + hours + ":" + minutes + ":" + seconds;
        }
        else {
            return "Please pass the date";
        }

    }
};