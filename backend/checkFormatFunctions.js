// checkFormatFunctions.js

const { JSDOM } = require("jsdom");

function checkFormatMoreDetails(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  // Adjusting for the new expected structure size
  if (bodyChildren.length !== 9) return false;

  // Adjusting the check for book info with <strong> and <div> for title and author
  const bookInfoContainer = bodyChildren[0];
  if (!bookInfoContainer.querySelector(".book-info")) return false;  // Ensure the book info is within an <a> tag

  const bookInfo = bookInfoContainer.querySelector(".book-info");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  const validBookInfoChildren = Array.from(bookInfo.children).filter(child =>
      child.matches("strong.book-title, div.book-author") ||
      (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );
  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Updating checks for the additional sections: Book Summary, Author's Credibility, and Endorsements to use <b> instead of <h3>
  const bookSummaryH3 = bodyChildren[3];
  const bookSummaryP = bodyChildren[4];
  if (bookSummaryH3.tagName !== "B" || bookSummaryP.tagName !== "P") return false;

  const authorCredibilityH3 = bodyChildren[5];
  const authorCredibilityP = bodyChildren[6];
  if (authorCredibilityH3.tagName !== "B" || authorCredibilityP.tagName !== "P") return false;

  const endorsementsH3 = bodyChildren[7];
  const endorsementsP = bodyChildren[8];
  if (endorsementsH3.tagName !== "B" || endorsementsP.tagName !== "P") return false;
  
  return true; // All checks passed
}


function checkFormatKeyInsights(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // Check 1: Adjusting for <a> tag wrapping the .book-info div
  const bookInfoContainer = bodyChildren[0];
  if (!bookInfoContainer.querySelector(".book-info")) return false;  // Ensure the book info is within an <a> tag

  const bookInfo = bookInfoContainer.querySelector(".book-info");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  // Allow for the optional presence of exactly one ratings-and-review div
  // Updated to allow <strong> for book-title
  const validBookInfoChildren = Array.from(bookInfo.children).filter(child =>
      child.matches("strong.book-title, div.book-author") ||
      (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Check 4: <b> with "Insights" instead of <h3> with "Key Insights"
  const insightsHeading = bodyChildren[3];
  if (insightsHeading.tagName !== "B" || !insightsHeading.textContent.includes("Insights")) return false;

  // Check 5: ol > li
  const insightsList = bodyChildren[4];
  if (insightsList.tagName !== "OL" || insightsList.children.length === 0) return false;
  for (const item of insightsList.children) {
      if (item.tagName !== "LI") return false; // Ensuring every child of the list is a list item
  }
  return true; // All checks passed
}

  
function checkFormatAnecdotes(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // Check 1: Adjusting for <a> tag wrapping the .book-info div
  const bookInfoContainer = bodyChildren[0];
  if (!bookInfoContainer.querySelector(".book-info")) return false; // Ensure the book info is within an <a> tag

  const bookInfo = bookInfoContainer.querySelector(".book-info");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  const validBookInfoChildren = Array.from(bookInfo.children).filter(child => 
      child.matches("strong.book-title, div.book-author") ||
      (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling)
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Check 4: <b> for Anecdotes header
  const anecdotesHeader = bodyChildren[3];
  if (anecdotesHeader.tagName !== "B" || !anecdotesHeader.textContent.includes("Anecdotes")) return false;

  // Check 5: ol > li, ensuring at least one li is present and all are <li> tags
  const listItems = bodyChildren[4];
  if (listItems.tagName !== "OL" || listItems.children.length < 1) return false;
  for (const item of listItems.children) {
      if (item.tagName !== "LI") return false; // Ensuring every child of the list is a list item
  }
  return true; // All checks passed
}

  
function checkFormatQuotes(content) {
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const bodyChildren = Array.from(document.body.children);

  if (bodyChildren.length !== 5) return false; // Ensuring there are exactly 5 elements at this level

  // Check 1: Adjusting for <a> tag wrapping the .book-info div
  const bookInfoContainer = bodyChildren[0];
  if (!bookInfoContainer.querySelector(".book-info")) return false; // Ensure the book info is within an <a> tag

  const bookInfo = bookInfoContainer.querySelector(".book-info");
  const ratingsAndReview = bookInfo.querySelector("div.ratings-and-review");

  // Allow for the optional presence of exactly one ratings-and-review div
  const validBookInfoChildren = Array.from(bookInfo.children).filter(child =>
      child.matches("strong.book-title, div.book-author") ||
      (child.matches("div.ratings-and-review") && !ratingsAndReview.nextSibling) // Ensure there's only one ratings-and-review div and it's the last child if present
  );

  if (validBookInfoChildren.length < 2 || validBookInfoChildren.length > 3) return false;

  // Check 2: div > img
  const imgContainer = bodyChildren[1];
  if (imgContainer.tagName !== "DIV" || imgContainer.children.length !== 1 || imgContainer.children[0].tagName !== "IMG") return false;

  // Check 3: div > a > button.buy-now-button
  const buyNowContainer = bodyChildren[2];
  if (buyNowContainer.tagName !== "DIV" || buyNowContainer.children.length !== 1 || buyNowContainer.children[0].tagName !== "A") return false;
  const buyNowButton = buyNowContainer.querySelector("button.buy-now-button");
  if (!buyNowButton) return false;

  // Check 4: <b> for Quotes header
  const quotesHeader = bodyChildren[3];
  if (quotesHeader.tagName !== "B") return false;

  // Check 5: ol > li for the quotes list
  const listItems = bodyChildren[4];
  if (listItems.tagName !== "OL" || listItems.children.length < 1) return false;
  for (const item of listItems.children) {
      if (item.tagName !== "LI") return false; // Ensuring every child of the list is a list item
  }
  
  return true; // All checks passed
}

  

module.exports = {
  checkFormatMoreDetails,
  checkFormatKeyInsights,
  checkFormatAnecdotes,
  checkFormatQuotes,
};
