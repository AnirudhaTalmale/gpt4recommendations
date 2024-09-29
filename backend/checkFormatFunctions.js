// checkFormatFunctions.js

const { JSDOM } = require("jsdom");

function checkFormatMoreDetails(content) {
  // console.log("content is", content);
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  // Ensure there are exactly 9 children in the body for the new structure
  if (bodyChildren.length !== 9) return false;
  // console.log("i am here 1");

  // Check for the book info container and ensure it has the correct class
  const bookInfoContainer = bodyChildren[0];
  if (!bookInfoContainer.matches(".book-info")) return false;
  // console.log("i am here 2");

  // Verify the structure within the book info container
  const ratingsAndReview = bookInfoContainer.querySelector("div.ratings-and-review");
  const validBookInfoChildren = Array.from(bookInfoContainer.children).filter(child =>
    child.matches("strong.book-title, div.book-author") ||
    (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );
  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;
  // console.log("i am here 3");
  
  // Check the image container for proper tags and structure
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;
  // console.log("i am here 4");

  // Validate the structure of the buy now button container
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  // console.log("i am here 5");

  // Ensure the buy now button is present
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;
  // console.log("i am here 6");

  // Check the book summary and author's credibility sections with updated tags
  const bookSummaryH3 = bodyChildren[3];
  const bookSummaryP = bodyChildren[4];
  if (bookSummaryH3.tagName !== "B" || bookSummaryP.tagName !== "P") return false;
  // console.log("i am here 7");

  const authorCredibilityH3 = bodyChildren[5];
  const authorCredibilityP = bodyChildren[6];
  if (authorCredibilityH3.tagName !== "B" || authorCredibilityP.tagName !== "P") return false;
  // console.log("i am here 8");

  // Validate endorsements section with correct tags
  const endorsementsH3 = bodyChildren[7];
  const endorsementsP = bodyChildren[8];
  if (endorsementsH3.tagName !== "B" || endorsementsP.tagName !== "P") return false;
  // console.log("i am here 9");

  // New Check: Ensure the last paragraph in endorsements ends with a full stop
  if (endorsementsP.textContent.trim().slice(-1) !== ".") return false;

  return true; // All checks passed
}

function checkFormatKeyInsights(content) {
  // console.log("content is", content);
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level
  // console.log("i am here 1");

  // Check 1: Ensure the first child is a div containing a class 'book-info' wrapped in <a>
  const bookInfoContainer = bodyChildren[0];
  if (bookInfoContainer.tagName !== "DIV" || !bookInfoContainer.classList.contains("book-info")) return false;
  // console.log("i am here 2");

  // Validate the structure inside 'book-info'
  const ratingsAndReview = bookInfoContainer.querySelector(".ratings-and-review");
  const validBookInfoChildren = Array.from(bookInfoContainer.children).filter(child =>
    child.matches("strong.book-title, div.book-author") ||
    (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;
  // console.log("i am here 3");

  // Check 2: Second child should be a div containing exactly one img element
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;
  // console.log("i am here 4");

  // Check 3: Third child should be a div containing an <a> that wraps a button with class 'buy-now-button'
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;
  // console.log("i am here 5");

  // Check 4: Fourth child should be a <b> tag containing the text "Insights"
  const insightsHeading = bodyChildren[3];
  if (insightsHeading.tagName !== "B" || !insightsHeading.textContent.includes("Insights")) return false;
  // console.log("i am here 6");

  // Check 5: Fifth child should be an ol tag with at least one li child
  const insightsList = bodyChildren[4];
  if (insightsList.tagName !== "OL" || Array.from(insightsList.children).every(child => child.tagName !== "LI")) return false;
  // console.log("i am here 7");

  // New Check: Ensure the last <li> in <ol> ends with a full stop
  const lastItem = insightsList.children[insightsList.children.length - 1];
  if (lastItem.textContent.trim().slice(-1) !== ".") return false;

  // console.log("All checks passed");
  return true; // All checks passed
}

function checkFormatAnecdotes(content) {
  // console.log("content is", content);
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // console.log("i am here 1");

  // Check 1: div.book-info > (strong.book-title + div.book-author + div.ratings-and-review)
  const bookInfoContainer = bodyChildren[0];
  if (bookInfoContainer.tagName !== "DIV" || !bookInfoContainer.classList.contains("book-info")) return false;

  const bookTitle = bookInfoContainer.querySelector("strong.book-title");
  const bookAuthor = bookInfoContainer.querySelector("div.book-author");
  const ratingsAndReview = bookInfoContainer.querySelector("div.ratings-and-review");

  if (!bookTitle || !bookAuthor || !ratingsAndReview) return false; // Ensuring all required elements are present
  // console.log("i am here 2");

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;
  // console.log("i am here 3");

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;
  // console.log("i am here 4");

  // Check 4: <b> for Anecdotes header
  const anecdotesHeader = bodyChildren[3];
  if (anecdotesHeader.tagName !== "B" || !anecdotesHeader.textContent.includes("Anecdotes")) return false;
  // console.log("i am here 5");

  // Check 5: ol > li, ensuring at least one li is present and all are <li> tags
  const listItems = bodyChildren[4];
  if (listItems.tagName !== "OL" || listItems.children.length < 1) return false;
  for (const item of listItems.children) {
      if (item.tagName !== "LI") return false;
      // console.log("i am here 6");
  }

  // New Check: Ensure the last <li> in <ol> ends with a full stop
  const lastItem = listItems.children[listItems.children.length - 1];
  if (lastItem.textContent.trim().slice(-1) !== ".") return false;

  // console.log("i am here 7");
  return true; // All checks passed
}

function checkFormatQuotes(content) {
  // console.log("content is", content);
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level
  // console.log("i am here 1");

  // Check 1: Direct presence of the .book-info div
  const bookInfoContainer = bodyChildren[0];
  if (!bookInfoContainer.matches(".book-info")) return false; // Ensure the book info is directly within the bodyChildren
  // console.log("i am here 2");

  const ratingsAndReview = bookInfoContainer.querySelector("div.ratings-and-review");

  // Allow for the optional presence of exactly one ratings-and-review div
  const validBookInfoChildren = Array.from(bookInfoContainer.children).filter(child =>
      child.matches("strong.book-title, div.book-author") ||
      (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling) // Ensure there's only one ratings-and-review div and it's the last child if present
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;
  // console.log("i am here 3");

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;
  // console.log("i am here 4");

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  // console.log("i am here 5");

  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;
  // console.log("i am here 6");

  // Check 4: <b> for Quotes header
  const quotesHeader = bodyChildren[3];
  if (quotesHeader.tagName !== "B") return false;
  // console.log("i am here 7");

  // Check 5: ol > li for the quotes list
  const listItems = bodyChildren[4];
  if (listItems.tagName !== "OL" || listItems.children.length < 1) return false;
  // console.log("i am here 8");

  for (const item of listItems.children) {
      if (item.tagName !== "LI") return false; // Ensuring every child of the list is a list item
  }

  // New Check: Ensure the last <li> in <ol> ends with a full stop
  const lastItem = listItems.children[listItems.children.length - 1];
  if (lastItem.textContent.trim().slice(-1) !== ".") return false;
  
  // console.log("i am here 9");
  return true; // All checks passed
}

module.exports = {
  checkFormatMoreDetails,
  checkFormatKeyInsights,
  checkFormatAnecdotes,
  checkFormatQuotes,
};