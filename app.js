const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("Public"));

mongoose.connect("mongodb://localhost:27017/todolistdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.set('useFindAndModify', false);


const itemSchema = {
    name: String
}

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "I like you"
});

const item3 = new Item({
    name: "You are stupid"
});

const listSchema = {
    name: String,
    items: [itemSchema]
}

const defaultItems = [item1, item2, item3];

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {

        if (foundItems.length === 0) {


            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Success");
                }
            });
            res.redirect("/");
        } else {

            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    });
});


app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({
        name: customListName
    }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });



});

app.post("/delete", function(req, res) {
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;
    if (listName == "Today") {
        Item.findByIdAndRemove(checkedItem, function(err) {
            if (!err) {
                console.log("Success");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItem
                }
            }
        }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});




app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/")
    } else {
        List.findOne({
            name: listName
        }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
});