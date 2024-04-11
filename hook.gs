function hook() {
  const sheet1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('feeds');
  const values = sheet1.getRange(2, 1, sheet1.getDataRange().getLastRow() - 1, sheet1.getDataRange().getLastColumn()).getValues();

  const feeds = [];
  values.forEach((value) => {
    const feed = {};
    feed["name"] = value[0];
    feed["link"] = value[1];
    feed["send"] = value[2];
    feeds.push(feed);
  });
  for (const feed of feeds) {
    let xml = UrlFetchApp.fetch(feed.link).getContentText();
    let document = XmlService.parse(xml);
    let items = document.getRootElement().getChild('channel').getChildren('item');

    items.reverse();

    for (let item of items) {
      let title = item.getChild('title').getText();
      let link = item.getChild('link').getValue();
      let pubDate = Utilities.formatDate(new Date(item.getChild('pubDate').getValue()), "JST", "yyyy-MM-dd'T'HH:mm:ssXXX");
      let sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('articles');
      let lastRow = sheet2.getDataRange().getLastRow();
      let urls = sheet2.getRange(1, 3, lastRow).getValues();

      if (urls.some(url => url[0] === link)) { continue; }

      sheet2.appendRow([feed.name, title, link, pubDate]);
      const message = { "content": '`' + feed.name + '`\n' + '**' + title + '**' + '\n' + link }

      const param = {
        "method": "POST",
        "headers": { 'Content-type': "application/json" },
        "payload": JSON.stringify(message)
      }

      UrlFetchApp.fetch(feed.send, param);
    }
  }
}
