//Stanzas type templates im XML Format
const templates = {
    //Stanza message
    message: `<message to="{{to}}" from="{{from}}" type="{{type}}" id="{{id}}">
                <body>{{body}}</body>
                <thread>{{thread}}</thread>
                <active xmlns="http://jabber.org/protocol/chatstates" />
                <request xmlns="urn:xmpp:receipts" />
                <x xmlns="jabber:x:event">
                    <composing />
                </x>
            </message>`,
    //Stanza presence
    presence: `<presence>
                <show>{{show}}</show>
                <status>{{status}}</status>
                <priority>{{priority}}</priority>
            </presence>`,
    //Stanza iq
    iq: `<iq type="{{type}}" id="{{id}}">
            <query xmlns="jabber:iq:roster">
                <item jid="{{jid}}" name="{{name}}"/>
            </query>
        </iq>`
};

export default templates;
