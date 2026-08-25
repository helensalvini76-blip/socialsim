#!/usr/bin/env python
"""Build the Strategic Commander briefing pack.

    python tools/build_ceo_brief.py "<output folder>"

Written for a Chief Executive who has not been involved in planning and will
play Strategic Commander. The line it walks: enough for him to prepare and not
be ambushed, nothing that tells him what is coming.
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from docx import Document
from docx.shared import Pt, Cm
from build_day_pack import (new_doc, title, heading, para, bullets, table,
                            callout, run, tight, NAVY, GREY)

NAME = '[Chief Executive name]'


def build(folder):
    doc, W = new_doc()

    title(doc, 'Exercise Jupiter', 'Briefing for the Strategic Commander')

    table(doc, W, [
        ['Prepared for', NAME + ', Chief Executive'],
        ['Prepared by', 'Helen Salvini, Exercise Director'],
        ['Executive Sponsor', 'Lynne Hall-Bentley'],
        ['Date of exercise', 'Thursday 10 September 2026'],
        ['Your commitment', 'Approximately 13:00 to 16:20, including the hot debrief'],
        ['Location', 'The Kirkwood, Dalton site'],
    ], [Cm(4.2), W - Cm(4.2)])

    para(doc, ('Thank you for taking the Strategic Commander role. Having the Chief Executive in the chair '
               'materially raises the value of this exercise: the decisions it is designed to surface are '
               'strategic ones, and they are yours to make. This briefing tells you what you need in order to '
               'prepare, without telling you what is going to happen. That balance is deliberate — the exercise '
               'is only worth running if the events are genuinely unexpected.', {}), after=8)

    # ── 1 ────────────────────────────────────────────────────────────
    heading(doc, '1.  The exercise in short')
    para(doc, 'A fire renders the main building at the Dalton site unusable and the inpatient unit has to be '
              'evacuated. Twelve inpatients are represented; eight are physically moved by actors into the car '
              'park, reassessed, and then dispersed to onward destinations. An incident management team runs in '
              'parallel in an incident coordination centre. External agencies are simulated by Exercise Control.',
         after=5)
    para(doc, 'It is a single-agency exercise. No external organisation is contacted and no emergency service is '
              'called. Everything outside the hospice is played by controllers.', after=6)

    table(doc, W, [
        ['12:30 – 13:00', 'Briefings, actor placement, final safety checks'],
        ['13:00', 'EXERCISE START'],
        ['13:00 – 14:05', 'Alarm, escalation, evacuation of representative patients'],
        ['13:45 – 15:15', 'Clearing station, onward transport and dispersal, incident management'],
        ['15:15 – 15:30', 'Recovery and next operational period'],
        ['15:30', 'EXERCISE END'],
        ['15:35 – 16:20', 'Hot debrief'],
    ], [Cm(3.4), W - Cm(3.4)])

    # ── 2 ────────────────────────────────────────────────────────────
    heading(doc, '2.  Assurance on clinical safety and service continuity')
    para(doc, ('This is the question you will rightly be asked, so it is answered first. ', {'bold': True}),
         ('The exercise is designed so that real care is not affected at any point.', {}), after=5)

    bullets(doc, [
        ('No real patients take part. ', 'Patients are played by briefed actors, or represented by an empty bed and a patient card. No real patient is moved, disturbed or included.'),
        ('No real clinical materials are used. ', 'No medication, no oxygen, no sharps and no clinical consumables. All props are labelled EXERCISE ONLY, stored separately and reconciled afterwards.'),
        ('No real emergency services are called ', 'and no external partner is contacted. The alarm receiving centre arrangements are confirmed in advance.'),
        ('Real operations are protected. ', 'Participation is capped, reserve staffing is held, and safe staffing for actual services takes precedence over the exercise at all times.'),
        ('It can be stopped instantly. ', 'Anyone may call NO DUFF for a real incident or EXERCISE STOP for a safety concern. Play halts immediately and real procedures take over. I can also reduce the scope or terminate the exercise at any point.'),
        ('Manual handling is tightly controlled. ', 'No actor is lifted or dragged. Bed-bound patients are represented by empty beds. Only trained staff use approved equipment on rehearsed routes.'),
        ('A written risk assessment and safety plan ', 'sit behind all of this, with named owners for each control. They are available to you on request.'),
    ])

    callout(doc, W, 'IN SHORT',
            'No real patient is involved, no real service is interrupted, and the exercise stops the moment anyone '
            'says it should. If a genuine incident occurs, the exercise ends and does not restart.')

    # ── 3 ────────────────────────────────────────────────────────────
    heading(doc, '3.  What the exercise is testing')
    para(doc, 'Eight objectives, of which four are directly yours as Strategic Commander:', after=5)
    table(doc, W, [
        ['Yours', 'Incident management — activation, roles, shared situational awareness, strategic intent, decision recording and meeting rhythm'],
        ['Yours', 'Onward dispersal — destination, transport, escort and prioritisation decisions when resources are constrained'],
        ['Yours', 'Communications — one authoritative source, consistent messages, families and staff informed before the public'],
        ['Yours', 'Business continuity and recovery — service continuity, staffing, records, re-entry and recovery governance'],
        ['Team', 'Detection and escalation; clinical evacuation decision-making; safe patient movement; the evacuation clearing station'],
    ], [Cm(1.9), W - Cm(1.9)])

    # ── 4 ────────────────────────────────────────────────────────────
    heading(doc, '4.  Your role on the day')
    para(doc, 'You are setting direction, not running the response. The most common way a senior leader loses '
              'value from an exercise like this is by being drawn into individual patient movements. Operational '
              'and clinical colleagues own those. Your work is the decisions nobody else can take.', after=5)
    bullets(doc, [
        'Authorising full evacuation, informed by but not delegated to clinical advice.',
        'Setting strategic intent and three to five time-bound objectives, then reviewing them at a set rhythm.',
        'Deciding how scarce transport and receiving capacity are prioritised across patients.',
        'Deciding what the organisation says publicly, when, and who says it.',
        'Deciding whether to activate mutual aid, business continuity and recovery structures.',
        'Deciding what the next operational period requires if the building is unavailable for 48 to 72 hours.',
        'Holding the boundary between managing the incident and managing the organisation.',
    ])

    # ── 5 ────────────────────────────────────────────────────────────
    heading(doc, '5.  What to expect, so that nothing lands as a surprise')
    para(doc, ('I will not tell you what happens or when. What follows is the shape of the pressure, so that the '
               'character of the exercise is familiar to you even though the events are not.', {'italic': True}),
         after=6, size=10)
    bullets(doc, [
        ('Information will be incomplete, delayed and at times wrong. ', 'You will be expected to make decisions anyway, stating your assumptions. That is the test, not a flaw in the design.'),
        ('External partners will be less available than you would like. ', 'Capacity is deliberately constrained and staggered. Clear, prioritised asks will get better results than general requests for help.'),
        ('There is a live simulated public and media environment. ', 'It runs on its own devices and is also projected in the incident coordination centre. It contains realistic media enquiries, public reaction, inaccurate claims and criticism of the organisation. Every account, journalist, resident and relative in it is invented, and none of it can reach the outside world.'),
        ('Families will feature prominently, ', 'including people seeking information and people who have heard something before you told them.'),
        ('The scenario includes challenge to the organisation itself, ', 'of the kind that follows any incident of this sort. It is scenario material written for the exercise and is not based on anything real at The Kirkwood.'),
        ('The pace is deliberate. ', 'There will be quiet stretches and there will be moments when several things arrive at once.'),
    ])

    callout(doc, W, 'ON THE SIMULATED MEDIA',
            'You will see a screen showing public reaction to the incident, including how long it has been since '
            'the organisation last said anything. It is designed to be uncomfortable. It is entirely contained, '
            'entirely invented, and switched off at 15:30.',
            fill='EFF6FF', colour='1E40AF')

    # ── 6 ────────────────────────────────────────────────────────────
    heading(doc, '6.  What good looks like')
    bullets(doc, [
        'A clear strategic intent expressed early, in a sentence your team can act on.',
        'Three to five objectives, time-bound, reviewed rather than set once and forgotten.',
        'Decisions recorded with the rationale, the risks accepted and a review point.',
        'A clinical voice that is empowered to say no to an operationally convenient option.',
        'Families and staff hearing from the organisation before they hear from anyone else.',
        'One authoritative public source, saying what is known, what is not, and when the next update comes.',
        'Recovery considered while the incident is still running, not afterwards.',
        'Attention paid to the patients and services not physically represented in the room.',
    ])

    # ── 7 ────────────────────────────────────────────────────────────
    heading(doc, '7.  Preparing')
    para(doc, 'Thirty minutes is enough, and nothing needs to be written.', after=5)
    bullets(doc, [
        'Re-read the strategic section of the hospice major incident plan, particularly who holds what authority.',
        'Decide in advance what you would want to be true within the first thirty minutes of any incident of this kind.',
        'Think about your own threshold for ordering a full evacuation, and what evidence you would want.',
        'Agree with Lynne how findings will be handled and who sees the report.',
    ])

    # ── 8 ────────────────────────────────────────────────────────────
    heading(doc, '8.  Outputs and governance')
    bullets(doc, [
        ('Hot debrief ', 'immediately afterwards, in separate frontline and incident management groups, then together.'),
        ('A written report ', 'against the eight objectives, rating each as effective, partially effective, ineffective or not observed, with evidence.'),
        ('An action plan ', 'with named owners, due dates and assurance evidence for closure.'),
        ('Any safety-critical finding ', 'is raised immediately with the Executive Sponsor rather than held for the report.'),
    ])
    para(doc, ('This is a no-blame exercise. ', {'bold': True}),
         ('Findings are about systems, plans, agreements and information flow. Nothing in the report identifies '
          'an individual, and the exercise is not an assessment of any person taking part, including you.', {}),
         after=6)

    heading(doc, '9.  Anything else')
    para(doc, 'If you would like a short conversation beforehand, I would welcome it — thirty minutes would be '
              'ample and would let me answer anything here in more detail without compromising the exercise. '
              'I am equally happy to be challenged on the design.', after=5)
    p = tight(doc.add_paragraph(), before=8, after=0)
    run(p, 'Helen Salvini', size=10.5, bold=True)
    p = tight(doc.add_paragraph(), after=0)
    run(p, 'Exercise Director  ·  BCR Consultants', size=10, colour=GREY)

    out = os.path.join(folder, 'Exercise Jupiter - Strategic Commander briefing.docx')
    doc.save(out)
    return out


if __name__ == '__main__':
    folder = sys.argv[1] if len(sys.argv) > 1 else '.'
    f = build(folder)
    print('wrote %s  (%.0fKB)' % (os.path.basename(f), os.path.getsize(f) / 1024))
