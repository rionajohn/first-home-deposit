/**
 * The seeded participant - who the person using this prototype is, as
 * distinct from what is in their accounts.
 *
 * WHY THIS IS A FILE AND NOT A STRING IN A SCREEN
 * The name is SCENARIO DATA, not a design element. The greeting on frame 01
 * is the copy; the name below is the participant the session is run as. If a
 * study scenario changes - a different persona, a pilot run under another
 * name - that is a data edit here and nothing else moves. A literal in the
 * markup, or a literal in content.js, would make it a copy edit instead, and
 * would put the participant's identity in the same place as the words
 * addressed to them.
 *
 * WHY NOT model/, config.js OR state.js
 *   - src/model/     holds every CALCULATION and the figures they run on
 *                    (MOCK_POSITION is money in, spending and saving). A name
 *                    is not a figure and nothing derives from it.
 *   - src/config.js  owns APP identity - the display name, the icon label,
 *                    the manifest. That is what the product is called, not
 *                    who is using it. See its own header.
 *   - src/state.js   holds the build-spec.md section 6 variables and the
 *                    journey flags, all of which a participant can change
 *                    during a session and all of which persist to
 *                    sessionStorage. The name is none of those things: it is
 *                    fixed for the whole study and is never written back.
 *
 * See DECISIONS.md D137.
 */

const persona = {
  /**
   * Given name only, as a bank's own home screen would greet someone. Read
   * by src/screens/home.js, which fills content.js's `/home`
   * `greetingTemplate` with it.
   *
   * THIS IS THE ONE EDIT A SCENARIO CHANGE NEEDS. Nothing else in the
   * codebase contains the name, in code or in a comment.
   */
  name: 'Finn',
};

export default persona;
