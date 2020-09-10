const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);   //SCHEMA

const item1 = new Item({
  name: "Buy grocery"
});

const item2 = new Item({
  name: "Complete assignments"
});

const item3 = new Item({
  name: "Read books"
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {

  const day = date.getDate();

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err)
          console.log(err);
        else
          console.log("Data inserted successfully");
      });
      res.redirect("/");
    }
    else
      res.render("list", { listTitle: day, newListItems: foundItems });
  })
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list

        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }

      else {
        //show existing list
        res.render("list", { listTitle: customListName, newListItems: foundList.items });
      }
    }
  });
})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;

  const lName = req.body.listName;
  const listName = lName.trim();

  const newItem = new Item({
    name: itemName
  });

  const day = date.getDate();
  const today = day.trim();

  if (listName === today) {
    newItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (!err) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
      else
        console.log(err);
    });
  }
});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const myId = checkedItemId.trim();    //to remove leading and trailing spaces

  const lName = req.body.listName;
  const listName = lName.trim();

  const day = date.getDate();
  const today = day.trim();

  if (today === listName) {
    Item.findByIdAndDelete(myId, function (err) {
      if (!err) {
        res.redirect("/");
      }
      else {
        console.log(err);
      }
    });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: myId } } }, function (err, foundList) {
      if (!err)
        res.redirect("/" + listName);
      else
        console.log(err);
    });

  }
});

app.get("/about", function (req, res) {
  res.render("about");
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
