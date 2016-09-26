setUpExtension('.FileContents', function(table) {
  var txt = '';
  table.querySelectorAll('.FileContents-line').forEach(
      r => txt += r.textContent + "\n");
  return txt;
});
