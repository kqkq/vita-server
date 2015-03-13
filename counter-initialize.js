// Create Daily Counter
for(var i = 0; i < 365; i++) {
    var day = new Date(2015, 0, i);
    if(db.daily_counter.find({"date": {"$gte": day, "$lte": day}}).count() == 0) {
        db.daily_counter.insert({"date": day, "light": 0, "air": 0, "water": 0, "heater": 0, "total": 0});
    }
}
// Create Main Counter
if(db.main_counter.find({}).count() == 1) {
    db.main_counter.insert({"light": 0, "air": 0, "water": 0, "heater": 0, "total": 0});
}