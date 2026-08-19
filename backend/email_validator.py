import httpx
import os

# Top 200+ disposable email domains from open-source blocklists
DISPOSABLE_DOMAINS = {
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
    'yopmail.com', 'trashmail.com', 'dispostable.com', 'getairmail.com',
    'sharklasers.com', 'throwaway.email', 'temp-mail.org', 'fakeinbox.com',
    'mailnesia.com', 'maildrop.cc', 'discard.email', 'burnermail.io',
    'mohmal.com', 'emailondeck.com', 'getnada.com', 'tempail.com',
    'guerrillamailblock.com', 'grr.la', 'guerrillamail.info', 'guerrillamail.net',
    'guerrillamail.de', 'crazymailing.com', 'harakirimail.com', 'tempr.email',
    'mailsac.com', 'mytemp.email', 'inboxkitten.com', 'minutemail.com',
    'spamgourmet.com', 'trashmail.net', 'yopmail.fr', 'mailcatch.com',
    'tempinbox.com', 'trash-mail.com', 'binkmail.com', 'filzmail.com',
    'jetable.org', 'tmail.ws', 'mailexpire.com', 'incognitomail.org',
    'mailforspam.com', 'spam4.me', 'mailinator.net', 'tempmailo.com',
    'tempmailaddress.com', 'throwam.com', 'trashmail.me', 'yopmail.net',
    'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu',
    'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us',
    'tempsky.com', 'mailnator.com', 'boun.cr', 'bugmenot.com', 'devnullmail.com',
    'dodgeit.com', 'e4ward.com', 'emailigo.de', 'emailtemporario.com.br',
    'ephemail.net', 'etranquil.com', 'fakebox.net', 'fakemail.fr',
    'fastacura.com', 'filzmail.com', 'fizmail.com', 'fr33mail.info',
    'frapmail.com', 'getonemail.com', 'getonemail.net', 'girlsundertheinfluence.com',
    'gishpuppy.com', 'great-host.in', 'greensloth.com', 'gsrv.co.uk',
    'guerrillamail.biz', 'guerrillamail.org', 'haltospam.com', 'hidemail.de',
    'hidzz.com', 'hotpop.com', 'ieatspam.eu', 'ieatspam.info', 'imails.info',
    'inboxalias.com', 'inboxclean.com', 'inboxclean.org', 'incognitomail.com',
    'incognitomail.net', 'ipoo.org', 'irish2me.com', 'jetable.com',
    'jetable.net', 'jnxjn.com', 'junk1e.com', 'kasmail.com', 'kaspop.com',
    'keepmymail.com', 'killmail.com', 'killmail.net', 'klzlk.com',
    'koszmail.pl', 'kurzepost.de', 'lawlita.com', 'letthemeatspam.com',
    'lhsdv.com', 'lifebyfood.com', 'link2mail.net', 'litedrop.com',
    'lookugly.com', 'lopl.co.cc', 'lortemail.dk', 'lovemeleaveme.com',
    'lr78.com', 'maboard.com', 'mail-temporaire.fr', 'mail.by', 'mail.mezimages.net',
    'mail2rss.org', 'mail333.com', 'mailbidon.com', 'mailblocks.com',
    'mailcatch.com', 'maileater.com', 'mailexpire.com', 'mailfreeonline.com',
    'mailin8r.com', 'mailinater.com', 'mailincubator.com', 'mailme.ir',
    'mailme.lv', 'mailmetrash.com', 'mailmoat.com', 'mailnull.com',
    'mailshell.com', 'mailsiphon.com', 'mailslite.com', 'mailtemporaire.com',
    'mailtemporaire.fr', 'mailzilla.com', 'mailzilla.org', 'mbx.cc',
    'mega.zik.dj', 'meltmail.com', 'messagebeamer.de', 'mezimages.net',
    'minimail.eu', 'mmmmail.com', 'moakt.com', 'mobi.web.id', 'mobileninja.co.uk',
    'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'mt2015.com',
    'mx0.wwwnew.eu', 'mypartyclip.de', 'myphantom.com', 'mysamp.de',
    'mytempemail.com', 'mytempmail.com', 'neomailbox.com', 'nepwk.com',
    'nervmich.net', 'nervtansen.de', 'netmails.com', 'netmails.net',
    'neverbox.com', 'no-spam.ws', 'nobulk.com', 'noclickemail.com',
    'nogmailspam.info', 'nomail.xl.cx', 'nomail2me.com', 'nomorespamemails.com',
    'nonspam.eu', 'nonspammer.de', 'noref.in', 'nospam.ze.tc', 'nospam4.us',
    'nospamfor.us', 'nospammail.net', 'nothingtoseehere.ca', 'nowmymail.com',
    'nurfuerspam.de', 'nus.edu.sg', 'nwldx.com', 'objectmail.com',
    'obobbo.com', 'odnorazovoe.ru', 'oneoffemail.com', 'onewaymail.com',
    'oopi.org', 'ordinaryamerican.net', 'owlpic.com', 'pancakemail.com',
    'pimpedupmyspace.com', 'pjjkp.com', 'plexolan.de', 'pookmail.com',
    'privacy.net', 'proxymail.eu', 'prtnx.com', 'putthisinyouremail.com',
    'qq.com', 'quickinbox.com', 'rcpt.at', 'reallymymail.com',
    'recode.me', 'recursor.net', 'regbypass.com', 'rejectmail.com',
    'rhyta.com', 'rklips.com', 'rmqkr.net', 'royal.net',
    'rppkn.com', 'rtrtr.com', 's0ny.net', 'safe-mail.net',
    'safersignup.de', 'safetymail.info', 'safetypost.de', 'sandelf.de',
    'saynotospams.com', 'scatmail.com', 'schafmail.de', 'selfdestructingmail.com',
    'sendspamhere.com', 'shiftmail.com', 'shitmail.me', 'shortmail.net',
    'sibmail.com', 'skeefmail.com', 'slaskpost.se', 'slipry.net',
    'slopsbox.com', 'slowslow.de', 'smashmail.de', 'smellfear.com',
    'snakemail.com', 'sneakemail.com', 'sneakymail.de', 'snkmail.com',
    'sofimail.com', 'sofort-mail.de', 'softpls.asia', 'sogetthis.com',
    'soodonims.com', 'spam.la', 'spam.su', 'spamavert.com',
    'spambob.com', 'spambob.net', 'spambob.org', 'spambog.com',
    'spambog.de', 'spambog.ru', 'spambox.us', 'spamcannon.com',
    'spamcannon.net', 'spamcero.com', 'spamcorptastic.com', 'spamcowboy.com',
    'spamcowboy.net', 'spamcowboy.org', 'spamday.com', 'spamex.com',
    'spamfighter.cf', 'spamfighter.ga', 'spamfighter.gq', 'spamfighter.ml',
    'spamfighter.tk', 'spamfree24.com', 'spamfree24.de', 'spamfree24.eu',
    'spamfree24.info', 'spamfree24.net', 'spamfree24.org', 'spamgourmet.com',
    'spamgourmet.net', 'spamgourmet.org', 'spamherelots.com', 'spamhereplease.com',
    'spamhole.com', 'spamify.com', 'spaminator.de', 'spamkill.info',
    'spaml.com', 'spaml.de', 'spammotel.com', 'spamobox.com',
    'spamoff.de', 'spamslicer.com', 'spamspot.com', 'spamstack.net',
    'spamthis.co.uk', 'spamtrail.com', 'spamtrap.ro', 'speed.1s.fr',
    'spikio.com', 'spoofmail.de', 'stuffmail.de', 'supergreatmail.com',
    'supermailer.jp', 'superrito.com', 'superstachel.de', 'suremail.info',
    'svk.jp', 'sweetxxx.de', 'tafmail.com', 'tagyoureit.com',
    'talkinator.com', 'tapchicuoihoi.com', 'teewars.org', 'teleworm.com',
    'temp-mail.de', 'temp-mail.live', 'temp-mail.ru', 'tempail.com',
    'tempalias.com', 'tempe4mail.com', 'tempemail.biz', 'tempemail.co.za',
    'tempemail.com', 'tempemail.net', 'tempinbox.com', 'tempmail.eu',
    'tempmail.it', 'tempmail2.com', 'tempmaildemo.com', 'tempmailer.com',
    'tempomail.fr', 'temporaryemail.net', 'temporaryemail.us',
    'temporaryforwarding.com', 'temporaryinbox.com', 'temporarymailaddress.com',
    'tempthe.net', 'thankdog.net', 'thankyou2010.com', 'thisisnotmyrealemail.com',
    'throwawayemailaddress.com', 'tittbit.in', 'tizi.com', 'tmailinator.com',
    'toiea.com', 'toomail.biz', 'topranklist.de', 'tradermail.info',
    'trash-amil.com', 'trash-mail.at', 'trash-mail.cf', 'trash-mail.ga',
    'trash-mail.gq', 'trash-mail.ml', 'trash-mail.tk', 'trash2009.com',
    'trashdevil.com', 'trashdevil.de', 'trashemail.de', 'trashmail.at',
    'trashmail.com', 'trashmail.de', 'trashmail.io', 'trashmail.org',
    'trashmail.ws', 'trashmailer.com', 'trashymail.com', 'trashymail.net'
}


async def is_disposable_email(email: str) -> bool:
    """Check if an email is from a disposable/temporary email provider.
    Uses local blocklist first (zero latency), then Disify API as fallback.
    Fails open on API errors to avoid blocking legitimate users."""
    try:
        domain = email.split('@')[1].lower()
    except (IndexError, AttributeError):
        return False

    # Layer 1: Local blocklist check (instant)
    if domain in DISPOSABLE_DOMAINS:
        return True

    # Layer 2: Check for suspicious domain patterns
    suspicious_keywords = ['temp', 'trash', 'disposable', 'throwaway', 'fake', 'spam', 'junk', 'burner']
    if any(keyword in domain for keyword in suspicious_keywords):
        return True

    # Layer 3: Disify API check (free, no auth required)
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f'https://disify.com/api/email/{email}')
            if res.status_code == 200:
                data = res.json()
                return data.get('disposable', False) or not data.get('dns', True)
    except Exception:
        pass  # Fail open

    return False
