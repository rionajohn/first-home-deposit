/**
 * Which guidance-not-advice line a screen carries.
 *
 * `content.shared.regulatory.guidanceNotAdvice` says the guidance is "based
 * on your account activity". That is true on the consent path and false
 * wherever no account activity was ever read: frame 04, which has carried it
 * since the build, and frames 09-13, 15, 29, 30 and 32, which general mode
 * has reached since DECISIONS.md D24 and D26. This module picks the line
 * that matches what the session actually has. See GAPS.md G52 and
 * DECISIONS.md D27.
 *
 * THE TEST. `left-over === null` - D24's own test, the one `savingCeiling`
 * uses, so the sourcing claim and the slider ceiling can never disagree
 * about whether accounts were read. Not `mode === 'general'`, because the
 * calculator is also reachable from `/goals` with no consent decision
 * recorded at all and `mode` still null (GAPS.md G50).
 *
 * THE SECOND HALF OF THE TEST, and why it is here. `left-over` is committed
 * by frame 05's Continue, not by consent, so on the consent path it is still
 * null while frame 05 is on screen - and frame 05 opens two of the screens
 * this module serves (29 "How we worked out your saving amount" and 32
 * "Where these figures come from") from its own rows, before that commit.
 * `left-over === null` alone would tell those two sheets that nothing had
 * been read on a path where money-in and essential-spending had just been
 * read from twelve months of activity and are on the screen behind them.
 * `money-in === null` is what "nothing was read" actually means: it is set
 * from MOCK_POSITION at consent and stays null for the whole of general
 * mode. On every other screen this module serves it is a no-op, because
 * there the two are null and non-null together.
 */
export function guidanceNotAdviceLine(state, content) {
  const nothingRead = state['left-over'].value === null && state['money-in'].value === null;
  return nothingRead
    ? content.shared.regulatoryAwaitingCheck.guidanceNotAdviceNoAccounts
    : content.shared.regulatory.guidanceNotAdvice;
}
