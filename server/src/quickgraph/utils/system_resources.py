"""System resources."""

import random

from ..dataset.schemas import BaseItem, CreateDataset, Preprocessing, TokenizerEnum
from ..resources.schemas import (
    BaseOntologyItem,
    EntityPreannotation,
    BaseOntologyItem,
    ResourceClassifications,
    CreateResourceModel,
)

# All but two MUI colors sampled from 500 on this palette: https://www.muicss.com/docs/v1/getting-started/colors
# These are used for determinstic colors, mainly presets where children share the same color.
MUI_COLOR_PALETTEE_500 = [
    "#E91E63",
    "#9C27B0",
    "#03A9F4",
    "#673AB7",
    "#F44336",
    "#795548",
    "#3F51B5",
    "#00BCD4",
    "#4CAF50",
    "#FFEB3B",
    "#FF9800",
    "#009688",
    "#2196F3",
    "#8BC34A",
    "#CDDC39",
    "#FF5722",
]


def get_random_color():
    """Creates a random hexadecimal color code"""
    r = lambda: random.randint(0, 255)
    return "#%02X%02X%02X" % (r(), r(), r())


# TODO: Add constraints and descriptions (esp. for ConceptNet5)
resources = [
    CreateResourceModel(
        name="CoNLL03",
        classification=ResourceClassifications.ontology,
        sub_classification="entity",
        content=[
            BaseOntologyItem(name="Organisation", color=get_random_color()),
            BaseOntologyItem(name="Person", color=get_random_color()),
            BaseOntologyItem(name="Location", color=get_random_color()),
            BaseOntologyItem(name="Miscellaneous", color=get_random_color()),
        ],
        is_blueprint=True,
    ),
    CreateResourceModel(
        name="SemEval07Task4",
        classification=ResourceClassifications.ontology,
        sub_classification="entity",
        content=[
            BaseOntologyItem(name="cause", color=get_random_color()),
            BaseOntologyItem(name="effect", color=get_random_color()),
            BaseOntologyItem(name="content", color=get_random_color()),
            BaseOntologyItem(name="container", color=get_random_color()),
            BaseOntologyItem(name="instrument", color=get_random_color()),
            BaseOntologyItem(name="agency", color=get_random_color()),
            BaseOntologyItem(name="origin", color=get_random_color()),
            BaseOntologyItem(name="entity", color=get_random_color()),
            BaseOntologyItem(name="part", color=get_random_color()),
            BaseOntologyItem(name="whole", color=get_random_color()),
            BaseOntologyItem(name="product", color=get_random_color()),
            BaseOntologyItem(name="producer", color=get_random_color()),
            BaseOntologyItem(name="theme", color=get_random_color()),
            BaseOntologyItem(name="tool", color=get_random_color()),
        ],
        is_blueprint=True,
    ),
    CreateResourceModel(
        name="SemEval10Task8",
        classification=ResourceClassifications.ontology,
        sub_classification="entity",
        content=[
            BaseOntologyItem(name="cause", color=get_random_color()),
            BaseOntologyItem(name="effect", color=get_random_color()),
            BaseOntologyItem(name="content", color=get_random_color()),
            BaseOntologyItem(name="container", color=get_random_color()),
            BaseOntologyItem(name="instrument", color=get_random_color()),
            BaseOntologyItem(name="agency", color=get_random_color()),
            BaseOntologyItem(name="origin", color=get_random_color()),
            BaseOntologyItem(name="entity", color=get_random_color()),
            BaseOntologyItem(name="destination", color=get_random_color()),
            BaseOntologyItem(name="component", color=get_random_color()),
            BaseOntologyItem(name="whole", color=get_random_color()),
            BaseOntologyItem(name="product", color=get_random_color()),
            BaseOntologyItem(name="producer", color=get_random_color()),
            BaseOntologyItem(name="member", color=get_random_color()),
            BaseOntologyItem(name="collection", color=get_random_color()),
            BaseOntologyItem(name="message", color=get_random_color()),
            BaseOntologyItem(name="topic", color=get_random_color()),
        ],
        is_blueprint=True,
    ),
    CreateResourceModel(
        name="OntoNotes",
        classification=ResourceClassifications.ontology,
        sub_classification="entity",
        content=[
            BaseOntologyItem(
                name="person",
                color=MUI_COLOR_PALETTEE_500[0],
                children=[
                    BaseOntologyItem(
                        name="artist",
                        color=MUI_COLOR_PALETTEE_500[0],
                        children=[
                            BaseOntologyItem(
                                name="actor", color=MUI_COLOR_PALETTEE_500[0]
                            ),
                            BaseOntologyItem(
                                name="author", color=MUI_COLOR_PALETTEE_500[0]
                            ),
                            BaseOntologyItem(
                                name="director", color=MUI_COLOR_PALETTEE_500[0]
                            ),
                            BaseOntologyItem(
                                name="music", color=MUI_COLOR_PALETTEE_500[0]
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="education",
                        color=MUI_COLOR_PALETTEE_500[0],
                        children=[
                            BaseOntologyItem(
                                name="studente", color=MUI_COLOR_PALETTEE_500[0]
                            ),
                            BaseOntologyItem(
                                name="teacher", color=MUI_COLOR_PALETTEE_500[0]
                            ),
                        ],
                    ),
                    BaseOntologyItem(name="athlete", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="business", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="coach", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="doctor", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="legal", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="military", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(
                        name="political_figure", color=MUI_COLOR_PALETTEE_500[0]
                    ),
                    BaseOntologyItem(
                        name="religious_figure", color=MUI_COLOR_PALETTEE_500[0]
                    ),
                    BaseOntologyItem(name="title", color=MUI_COLOR_PALETTEE_500[0]),
                ],
            ),
            BaseOntologyItem(
                name="location",
                color=MUI_COLOR_PALETTEE_500[1],
                children=[
                    BaseOntologyItem(
                        name="structure",
                        color=MUI_COLOR_PALETTEE_500[1],
                        children=[
                            BaseOntologyItem(
                                name="airport", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="government", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="hospital", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="hotel", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="restaurant", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="sports_facility", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="theatre", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="geography",
                        color=MUI_COLOR_PALETTEE_500[1],
                        children=[
                            BaseOntologyItem(
                                name="body_of_water", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="island", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="mountain", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="transit",
                        color=MUI_COLOR_PALETTEE_500[1],
                        children=[
                            BaseOntologyItem(
                                name="bridge", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="railway", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                            BaseOntologyItem(
                                name="road", color=MUI_COLOR_PALETTEE_500[1]
                            ),
                        ],
                    ),
                    BaseOntologyItem(name="celestial", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="city", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="country", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="park", color=MUI_COLOR_PALETTEE_500[1]),
                ],
            ),
            BaseOntologyItem(
                name="organisation",
                color=MUI_COLOR_PALETTEE_500[2],
                children=[
                    BaseOntologyItem(
                        name="company",
                        color=MUI_COLOR_PALETTEE_500[2],
                        children=[
                            BaseOntologyItem(
                                name="broadcast", color=MUI_COLOR_PALETTEE_500[2]
                            ),
                            BaseOntologyItem(
                                name="news", color=MUI_COLOR_PALETTEE_500[2]
                            ),
                        ],
                    ),
                    BaseOntologyItem(name="education", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(
                        name="government", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(name="military", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(name="music", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(
                        name="political_party", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(
                        name="sports_league", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(
                        name="sports_team", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(name="transit", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(
                        name="stock_exchange", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(
                        name="stock_exchange", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                ],
            ),
            BaseOntologyItem(
                name="other",
                color=MUI_COLOR_PALETTEE_500[3],
                children=[
                    BaseOntologyItem(
                        name="art",
                        color=MUI_COLOR_PALETTEE_500[3],
                        children=[
                            BaseOntologyItem(
                                name="broadcast", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="film", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="music", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="stage", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="writing", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="event",
                        color=MUI_COLOR_PALETTEE_500[3],
                        children=[
                            BaseOntologyItem(
                                name="accident", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="election", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="holiday", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="natural_disaster", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="protest", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="sports_event", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="violent_conflict", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="health",
                        color=MUI_COLOR_PALETTEE_500[3],
                        children=[
                            BaseOntologyItem(
                                name="malady", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="treatment", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                        ],
                    ),
                    BaseOntologyItem(name="award", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="body_part", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="currency", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(
                        name="language",
                        color=MUI_COLOR_PALETTEE_500[3],
                        children=[
                            BaseOntologyItem(
                                name="programming_language",
                                color=MUI_COLOR_PALETTEE_500[3],
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="living_thing",
                        color=MUI_COLOR_PALETTEE_500[3],
                        children=[
                            BaseOntologyItem(
                                name="animal", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                        ],
                    ),
                    BaseOntologyItem(
                        name="product",
                        color=MUI_COLOR_PALETTEE_500[3],
                        children=[
                            BaseOntologyItem(
                                name="camera", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="car", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="computer", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="mobile_phone", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="software", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                            BaseOntologyItem(
                                name="weapon", color=MUI_COLOR_PALETTEE_500[3]
                            ),
                        ],
                    ),
                    BaseOntologyItem(name="food", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="heritage", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="internet", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="legal", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="religion", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(
                        name="scientific", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="sports_and_leisure", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="supernatural", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                ],
            ),
        ],
    ),
    CreateResourceModel(
        name="FIGER",
        classification=ResourceClassifications.ontology,
        sub_classification="entity",
        is_blueprint=True,
        content=[
            BaseOntologyItem(
                name="person",
                color=MUI_COLOR_PALETTEE_500[0],
                children=[
                    BaseOntologyItem(name="actor", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="architect", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="artist", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="athlete", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="author", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="coach", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="director", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="doctor", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="engineer", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="musician", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(
                        name="politician", color=MUI_COLOR_PALETTEE_500[0]
                    ),
                    BaseOntologyItem(
                        name="religious_leader", color=MUI_COLOR_PALETTEE_500[0]
                    ),
                    BaseOntologyItem(name="soldier", color=MUI_COLOR_PALETTEE_500[0]),
                    BaseOntologyItem(name="terrorist", color=MUI_COLOR_PALETTEE_500[0]),
                ],
            ),
            BaseOntologyItem(
                name="location",
                color=MUI_COLOR_PALETTEE_500[1],
                children=[
                    BaseOntologyItem(
                        name="body_of_water", color=MUI_COLOR_PALETTEE_500[1]
                    ),
                    BaseOntologyItem(name="bridge", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="city", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="country", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="county", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="province", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="railway", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="road", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="island", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="glacier", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(
                        name="astral_body", color=MUI_COLOR_PALETTEE_500[1]
                    ),
                    BaseOntologyItem(name="cemetery", color=MUI_COLOR_PALETTEE_500[1]),
                    BaseOntologyItem(name="park", color=MUI_COLOR_PALETTEE_500[1]),
                ],
            ),
            BaseOntologyItem(
                name="building",
                color=MUI_COLOR_PALETTEE_500[2],
                children=[
                    BaseOntologyItem(name="airport", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(name="dam", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(name="hospital", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(name="hotel", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(name="library", color=MUI_COLOR_PALETTEE_500[2]),
                    BaseOntologyItem(
                        name="power_station", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(
                        name="restaurant", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(
                        name="sports_facility", color=MUI_COLOR_PALETTEE_500[2]
                    ),
                    BaseOntologyItem(name="theater", color=MUI_COLOR_PALETTEE_500[2]),
                ],
            ),
            BaseOntologyItem(
                name="organisation",
                color=MUI_COLOR_PALETTEE_500[3],
                children=[
                    BaseOntologyItem(name="airline", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(name="company", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(
                        name="educational_institution", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="fraternity_sorority", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="sports_league", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="sports_team", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="terrorist_organization", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="government_agency", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="government", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="political_party", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(
                        name="educational_department", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                    BaseOntologyItem(name="military", color=MUI_COLOR_PALETTEE_500[3]),
                    BaseOntologyItem(
                        name="news_agency", color=MUI_COLOR_PALETTEE_500[3]
                    ),
                ],
            ),
            BaseOntologyItem(
                name="product",
                color=MUI_COLOR_PALETTEE_500[4],
                children=[
                    BaseOntologyItem(name="engine", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(name="airplane", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(name="car", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(name="ship", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(
                        name="spacecraft", color=MUI_COLOR_PALETTEE_500[4]
                    ),
                    BaseOntologyItem(name="camera", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(
                        name="mobile_phone", color=MUI_COLOR_PALETTEE_500[4]
                    ),
                    BaseOntologyItem(name="computer", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(name="software", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(name="game", color=MUI_COLOR_PALETTEE_500[4]),
                    BaseOntologyItem(
                        name="instrument", color=MUI_COLOR_PALETTEE_500[4]
                    ),
                    BaseOntologyItem(name="weapon", color=MUI_COLOR_PALETTEE_500[4]),
                ],
            ),
            BaseOntologyItem(
                name="art",
                color=MUI_COLOR_PALETTEE_500[5],
                children=[
                    BaseOntologyItem(name="film", color=MUI_COLOR_PALETTEE_500[5]),
                    BaseOntologyItem(name="play", color=MUI_COLOR_PALETTEE_500[5]),
                    BaseOntologyItem(
                        name="written_work", color=MUI_COLOR_PALETTEE_500[5]
                    ),
                    BaseOntologyItem(name="newspaper", color=MUI_COLOR_PALETTEE_500[5]),
                    BaseOntologyItem(name="music", color=MUI_COLOR_PALETTEE_500[5]),
                ],
            ),
            BaseOntologyItem(
                name="event",
                color=MUI_COLOR_PALETTEE_500[6],
                children=[
                    BaseOntologyItem(name="attack", color=MUI_COLOR_PALETTEE_500[6]),
                    BaseOntologyItem(name="election", color=MUI_COLOR_PALETTEE_500[6]),
                    BaseOntologyItem(name="protest", color=MUI_COLOR_PALETTEE_500[6]),
                    BaseOntologyItem(
                        name="military_conflict", color=MUI_COLOR_PALETTEE_500[6]
                    ),
                    BaseOntologyItem(
                        name="natural_disaster", color=MUI_COLOR_PALETTEE_500[6]
                    ),
                    BaseOntologyItem(
                        name="sports_event", color=MUI_COLOR_PALETTEE_500[6]
                    ),
                    BaseOntologyItem(
                        name="terrorist_attack", color=MUI_COLOR_PALETTEE_500[6]
                    ),
                ],
            ),
            BaseOntologyItem(name="time", color=get_random_color()),
            BaseOntologyItem(name="color", color=get_random_color()),
            BaseOntologyItem(name="award", color=get_random_color()),
            BaseOntologyItem(name="educational_degree", color=get_random_color()),
            BaseOntologyItem(name="title", color=get_random_color()),
            BaseOntologyItem(name="law", color=get_random_color()),
            BaseOntologyItem(name="ethnicity", color=get_random_color()),
            BaseOntologyItem(name="language", color=get_random_color()),
            BaseOntologyItem(name="religion", color=get_random_color()),
            BaseOntologyItem(name="god", color=get_random_color()),
            BaseOntologyItem(name="chemical_thing", color=get_random_color()),
            BaseOntologyItem(name="biological_thing", color=get_random_color()),
            BaseOntologyItem(name="medical_treatment", color=get_random_color()),
            BaseOntologyItem(name="disease", color=get_random_color()),
            BaseOntologyItem(name="symptom", color=get_random_color()),
            BaseOntologyItem(name="drug", color=get_random_color()),
            BaseOntologyItem(name="body_part", color=get_random_color()),
            BaseOntologyItem(name="living_thing", color=get_random_color()),
            BaseOntologyItem(name="animal", color=get_random_color()),
            BaseOntologyItem(name="food", color=get_random_color()),
            BaseOntologyItem(name="website", color=get_random_color()),
            BaseOntologyItem(name="broadcast_network", color=get_random_color()),
            BaseOntologyItem(name="broadcast_program", color=get_random_color()),
            BaseOntologyItem(name="tv_channel", color=get_random_color()),
            BaseOntologyItem(name="currency", color=get_random_color()),
            BaseOntologyItem(name="stock_exchange", color=get_random_color()),
            BaseOntologyItem(name="algorithm", color=get_random_color()),
            BaseOntologyItem(name="programming_language", color=get_random_color()),
            BaseOntologyItem(name="transit_system", color=get_random_color()),
            BaseOntologyItem(name="transit_line", color=get_random_color()),
        ],
    ),
    CreateResourceModel(
        name="MaintIE-lite",
        classification=ResourceClassifications.ontology,
        sub_classification="entity",
        is_blueprint=True,
        content=[
            BaseOntologyItem(name="Activity", color=MUI_COLOR_PALETTEE_500[0]),
            BaseOntologyItem(name="PhysicalObject", color=MUI_COLOR_PALETTEE_500[1]),
            BaseOntologyItem(name="State", color=MUI_COLOR_PALETTEE_500[2]),
            BaseOntologyItem(name="Process", color=MUI_COLOR_PALETTEE_500[3]),
            BaseOntologyItem(name="Property", color=MUI_COLOR_PALETTEE_500[4]),
        ],
    ),
    CreateResourceModel(
        name="MaintIE-lite",
        classification=ResourceClassifications.ontology,
        sub_classification="relation",
        is_blueprint=True,
        content=[
            BaseOntologyItem(name="contains"),
            BaseOntologyItem(name="hasPart"),
            BaseOntologyItem(name="hasParticipant"),
            BaseOntologyItem(name="hasProperty"),
        ],
    ),
    CreateResourceModel(
        name="ConceptNet5",
        classification=ResourceClassifications.ontology,
        sub_classification="relation",
        is_blueprint=True,
        content=[
            BaseOntologyItem(name="RelatedTo"),
            BaseOntologyItem(name="FormOf"),
            BaseOntologyItem(name="IsA"),
            BaseOntologyItem(name="PartOf"),
            BaseOntologyItem(name="HasA"),
            BaseOntologyItem(name="UsedFor"),
            BaseOntologyItem(name="CapableOf"),
            BaseOntologyItem(name="AtLocation"),
            BaseOntologyItem(name="Causes"),
            BaseOntologyItem(name="HasSubevent"),
            BaseOntologyItem(name="HasFirstSubevent"),
            BaseOntologyItem(name="HasLastSubevent"),
            BaseOntologyItem(name="HasPrerequisite"),
            BaseOntologyItem(name="HasProperty"),
            BaseOntologyItem(name="MotivatedByGoal"),
            BaseOntologyItem(name="ObstructedBy"),
            BaseOntologyItem(name="Desires"),
            BaseOntologyItem(name="CreatedBy"),
            BaseOntologyItem(name="Synonym"),
            BaseOntologyItem(name="Antonym"),
            BaseOntologyItem(name="DistinctFrom"),
            BaseOntologyItem(name="DerivedFrom"),
            BaseOntologyItem(name="SymbolOf"),
            BaseOntologyItem(name="DefinedAs"),
            BaseOntologyItem(name="MannerOf"),
            BaseOntologyItem(name="LocatedNear"),
            BaseOntologyItem(name="HasContext"),
            BaseOntologyItem(name="EtymologicallyRelatedTo"),
            BaseOntologyItem(name="EtymologicallyDerivedFrom"),
            BaseOntologyItem(name="CausesDesire"),
            BaseOntologyItem(name="MadeOf"),
            BaseOntologyItem(name="ReceivesAction"),
            BaseOntologyItem(name="ExternalURL"),
        ],
    ),
    CreateResourceModel(
        name="Coreference",
        classification=ResourceClassifications.ontology,
        sub_classification="relation",
        is_blueprint=True,
        content=[
            BaseOntologyItem(
                name="coref",
                description="The most granular relation in coreference resolution",
            )
        ],
    ),
    CreateResourceModel(
        name="SemEval07Task4",
        classification=ResourceClassifications.ontology,
        sub_classification="relation",
        is_blueprint=True,
        content=[
            BaseOntologyItem(
                name="cause_effect",
            ),
            BaseOntologyItem(
                name="content_container",
            ),
            BaseOntologyItem(
                name="instrument_agency",
            ),
            BaseOntologyItem(
                name="origin_entity",
            ),
            BaseOntologyItem(
                name="part_whole",
            ),
            BaseOntologyItem(
                name="product_producer",
            ),
            BaseOntologyItem(
                name="theme_tool",
            ),
        ],
    ),
    CreateResourceModel(
        name="SemEval10Task8",
        classification=ResourceClassifications.ontology,
        sub_classification="relation",
        is_blueprint=True,
        content=[
            BaseOntologyItem(
                name="cause_effect",
            ),
            BaseOntologyItem(
                name="content_container",
            ),
            BaseOntologyItem(
                name="instrument_agency",
            ),
            BaseOntologyItem(
                name="entity_origin",
            ),
            BaseOntologyItem(
                name="entity_destination",
            ),
            BaseOntologyItem(
                name="component_whole",
            ),
            BaseOntologyItem(
                name="member_collection",
            ),
            BaseOntologyItem(
                name="product_producer",
            ),
            BaseOntologyItem(
                name="messenger_topic",
            ),
        ],
    ),
]


# preannotation_resources = {
#     "MaintIE-lite": CreateResourceModel(
#         name="MaintIE-lite",
#         classification=ResourceClassifications.preannotation,
#         sub_classification="entity",
#         content=[
#             EntityPreannotation(
#                 surface_form="pump",
#                 classification="PhysicalObject",
#             ),
#             EntityPreannotation(
#                 surface_form="change out",
#                 classification="Activity",
#             ),
#             EntityPreannotation(
#                 surface_form="replace",
#                 classification="Activity",
#             ),
#             EntityPreannotation(
#                 surface_form="hose",
#                 classification="PhysicalObject",
#             ),
#         ],
#     ),
# }


datasets = [
    CreateDataset(
        name="wnut-twitter",
        description="Noisy user-generated content from Twitter",
        data_type="text",
        items=["Barack Obama left the White House."],
        preprocessing=Preprocessing(tokenizer=TokenizerEnum.whitespace),
        is_blueprint=True,
        is_annotated=False,
    ),
    CreateDataset(
        name="MaintIE-demo",
        description="Demonstration of maintenance dataset for information extraction",
        data_type="text",
        items=[
            "replace engine oil",
            "change out engine coolant and oil",
            "engine turbocharger is blown - remove and replace",
            "coolant hose leaking - replace",
        ],
        preprocessing=Preprocessing(tokenizer=TokenizerEnum.whitespace),
        is_blueprint=True,
        is_annotated=False,
    ),
]


# system_entity_resources = {
#   FIGER: [
#     {
#       name: "person",
#       description: "",
#       children: [
#         {
#           name: "actor",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "architect",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "artist",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "athlete",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "author",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "coach",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "director",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "doctor",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "engineer",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "monarch",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "musician",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "politician",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "religious_leader",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "soldier",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "terrorist",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[0],

#       isEntity: true,
#     },
#     {
#       name: "location",
#       description: "",
#       children: [
#         {
#           name: "body_of_water",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "bridge",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "city",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "country",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "county",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "province",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "railway",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "road",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },

#         {
#           name: "island",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "mountain",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "glacier",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "astral_body",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "cemetery",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "park",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[1],

#       isEntity: true,
#     },
#     {
#       name: "building",
#       description: "",
#       children: [
#         {
#           name: "airport",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "dam",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "hospital",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "hotel",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "library",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "power_station",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "restaurant",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "sports_facility",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "theater",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[2],

#       isEntity: true,
#     },
#     {
#       name: "organisation",
#       description: "",
#       children: [
#         {
#           name: "airline",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "company",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "educational_institution",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "fraternity_sorority",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "sports_league",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "sports_team",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "terrorist_organization",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "government_agency",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "government",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "political_party",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "educational_department",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "military",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "news_agency",


#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[3],

#       isEntity: true,
#     },
#     {
#       name: "product",
#       description: "",
#       children: [
#         {
#           name: "engine",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "airplane",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "car",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "ship",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "spacecraft",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "camera",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "mobile_phone",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "computer",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "software",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "game",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "instrument",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#         {
#           name: "weapon",


#           color: MUI_COLOR_PALETTEE_500[4],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[4],

#       isEntity: true,
#     },
#     {
#       name: "art",
#       description: "",
#       children: [
#         {
#           name: "film",


#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "play",


#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "written_work",


#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "newspaper",


#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "music",


#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[5],

#       isEntity: true,
#     },
#     {
#       name: "event",
#       description: "",
#       children: [
#         {
#           name: "attack",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "election",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "protest",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "military_conflict",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "natural_disaster",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "sports_event",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "terrorist_attack",


#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[6],

#       isEntity: true,
#     },
#     {
#       name: "time",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "color",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "award",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "educational_degree",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "title",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "law",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "ethnicity",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "language",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "religion",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "god",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "chemical_thing",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "biological_thing",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "medical_treatment",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "disease",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "symptom",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "drug",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "body_part",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "living_thing",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "animal",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "food",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "website",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "broadcast_network",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "broadcast_program",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "tv_channel",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "currency",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "stock_exchange",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "algorithm",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "programming_language",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "transit_system",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#     {
#       name: "transit_line",
#       description: "",
#       children: [],
#       color: getRandomColor(),

#       isEntity: true,
#     },
#   ],
#   MIE: [
#     {
#       name: "State",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[8],
#       children: [
#         {
#           name: "DesirableState",

#           color: MUI_COLOR_PALETTEE_500[8],
#           children: [
#             {
#               name: "NormalState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],

#               isEntity: true,
#             },
#           ],


#         },
#         {
#           name: "UndesirableState",

#           color: MUI_COLOR_PALETTEE_500[8],
#           children: [
#             {
#               name: "FailedState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],

#               isEntity: true,
#             },
#             {
#               name: "DegradedState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],

#               isEntity: true,
#             },
#           ],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "Activity",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[0],
#       children: [
#         {
#           name: "Event",

#           children: [
#             {
#               name: "UndesirableProcess",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "DesirableProcess",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "PointInTime",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "PeriodInTime",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "MaintenanceActivity",

#           children: [
#             {
#               name: "Adjust",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Calibrate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Diagnose",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Inspect",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Replace",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Repair",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Service",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "SupportingActivity",

#           children: [
#             {
#               name: "Admin",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Assemble",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Isolate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Measure",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Modify",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Move",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Operate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Perform",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Teamwork",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "Quality",
#       description: "Child of /Aspect",
#       color: MUI_COLOR_PALETTEE_500[1],
#       children: [
#         {
#           name: "PhysicalQuantity",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "RealizableEntity",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[2],
#       children: [
#         {
#           name: "Role",

#           color: MUI_COLOR_PALETTEE_500[2],


#           children: [
#             {
#               name: "RegulatoryRole",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[2],

#               isEntity: true,
#             },
#           ],
#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "FunctionalObject",
#       description: "Child of /Object",
#       color: MUI_COLOR_PALETTEE_500[3],

#       isEntity: true,
#       children: [],
#     },
#     {
#       name: "Location",
#       description: "Child of /Object",
#       color: MUI_COLOR_PALETTEE_500[5],

#       isEntity: true,
#       children: [
#         {
#           name: "Site",


#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "SpatialLocation",

#           color: MUI_COLOR_PALETTEE_500[5],


#           children: [
#             {
#               name: "PointInSpace",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[5],

#               isEntity: true,
#               children: [],
#             },
#             {
#               name: "RegionInSpace",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[5],

#               isEntity: true,
#               children: [],
#             },
#           ],
#         },
#         {
#           name: "SpatialIndicator",

#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#       ],
#     },
#     {
#       name: "Organization",
#       description: "Child of /Object",
#       color: MUI_COLOR_PALETTEE_500[6],

#       isEntity: true,
#       children: [],
#     },
#     {
#       description: "Child of /Object",
#       color: MUI_COLOR_PALETTEE_500[7],

#       isEntity: true,
#       children: [
#         {
#           name: "Feature",


#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "Organism",

#           color: MUI_COLOR_PALETTEE_500[7],


#           children: [
#             {
#               name: "Person",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#         },
#         {
#           name: "SensingObject",

#           children: [
#             {
#               name: "ElectricPotentialSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ResistivitySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricCurrentSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "DensitySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FieldSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FlowSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PhysicalDimensionSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnergySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PowerSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TimeSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LevelSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HumiditySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PressureSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ConcentrationSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "RadiationSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TimeRatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TemperatureSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultiQuantitySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ForceSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AudioVisualSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "InformationSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "IncidentSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "StoringObject",

#           children: [
#             {
#               name: "CapacitiveStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "InductiveStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },

#             {
#               name: "ElectrochemicalStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "InformationStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpenStationaryStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnclosedStationaryStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MoveableStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalEnergyStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "EmittingObject",

#           children: [
#             {
#               name: "LightObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricCoolingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "WirelessPowerObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalEnergyTransferObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CombustionHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalCoolingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "NuclearPoweredHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ParticleEmittingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AcousticWaveEmittingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "ProtectingObject",

#           children: [
#             {
#               name: "OvervoltageProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EarthFaultCurrentProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OvercurrentProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FieldProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PressureProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FireProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalForceProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PreventiveProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "WearProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnvironmentProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TemperatureProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "GeneratingObject",

#           children: [
#             {
#               name: "MechanicalToElectricalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ChemicalToElectricalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolarToElectricalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SignalGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ContinuousTransferObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "DiscontinuousTransferObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LiquidFlowGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "GaseousFlowGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolarToThermalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "MatterProcessingObject",

#           children: [
#             {
#               name: "PrimaryFormingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SurfaceTreatmentObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AssemblingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ForceSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricOrMagneticSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ChemicalSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "GrindingAndCrushingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AgglomeratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MixingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReactingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "InformationProcessingObject",

#           children: [
#             {
#               name: "ElectricSignalProcessingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSignalRelayingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpticalSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FluidSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleKindSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "DrivingObject",

#           children: [
#             {
#               name: "ElectromagneticRotationalDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectromagneticLinearDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MagneticForceDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PiezoelectricDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FluidPoweredDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CombustionEngine",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HeatEngine",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "CoveringObject",

#           children: [
#             {
#               name: "InfillingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ClosureObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FinishingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TerminatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "PresentingObject",

#           children: [
#             {
#               name: "VisibleStateIndicator",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ScalarDisplay",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "GraphicalDisplay",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AcousticDevice",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TactileDevice",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OrnamentalObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleFormPresentingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "ControllingObject",

#           children: [
#             {
#               name: "ElectricControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricEarthingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SealedFluidSwitchingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SealedFluidVaryingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpenFlowControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SpaceAccessObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolidSubstanceFlowVaryingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalMovementControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleMeasureControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "RestrictingObject",

#           children: [
#             {
#               name: "ElectricityRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricityStabilisingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SignalStabilisingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MovementRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReturnFlowRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FlowRestrictor",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LocalClimateStabilisingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AccessRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "HumanInteractionObject",

#           children: [
#             {
#               name: "FaceInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HandInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FootInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FingerInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MovementInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultiInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "TransformingObject",

#           children: [
#             {
#               name: "ElectricEnergyTransformingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricEnergyConvertingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "UniversalPowerSupply",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SignalConvertingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyTransformingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MassReductionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MatterReshapingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OrganicPlant",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "HoldingObject",

#           children: [
#             {
#               name: "PositioningObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CarryingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnclosingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "StructuralSupportingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReinforcingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FramingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "JointingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FasteningObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LevellingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ExistingGround",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "GuidingObject",

#           children: [
#             {
#               name: "ElectricEnergyGuidingObject",
#               description: "Merged High Voltage and Low Voltage",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReferencePotentialGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSignalGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LightGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SoundGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolidMatterGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpenEnclosureGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ClosedEnclosureGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "RailObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalEnergyGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleFlowGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "InterfacingObject",

#           children: [
#             {
#               name: "HighVoltageConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LowVoltageConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PotentialConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSignalConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LightCollectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CollectingInterfacingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SealedFlowConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "NonDetachableCoupling",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "DetachableCoupling",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LevelConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SpaceLinkingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleFlowConnectorObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#       ],
#     },
#     {
#       name: "Miscellaneous",
#       description: "",
#       children: [
#         {
#           name: "Cardinality",


#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#         {
#           name: "Uncertainty",


#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[9],

#       isEntity: true,
#     },
#   ],
#   FMEA: [
#     {
#       name: "Mode",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[0],
#       children: [],

#       isEntity: true,
#     },
#     {
#       name: "Cause",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[1],
#       children: [],

#       isEntity: true,
#     },
#     {
#       name: "Effect",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[2],
#       children: [],

#       isEntity: true,
#     },
#     {
#       name: "Mechanism",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[3],
#       children: [],

#       isEntity: true,
#     },
#     {
#       name: "Detection",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[4],
#       children: [],

#       isEntity: true,
#     },
#     {
#       name: "Item",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[5],
#       children: [
#         {
#           name: "Equipment",

#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "Component",

#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "Part",

#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "Identifier",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[6],
#       children: [],

#       isEntity: true,
#     },
#     {
#       name: "Location",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[8],
#       children: [],

#       isEntity: true,
#     },
#   ],
#   MESSA: [
#     {
#       name: "State",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[8],
#       children: [
#         {
#           name: "DesirableState",

#           color: MUI_COLOR_PALETTEE_500[8],
#           children: [
#             {
#               name: "NormalState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],
#               isEntity: true,
#             },
#           ],

#         },
#         {
#           name: "UndesirableState",

#           color: MUI_COLOR_PALETTEE_500[8],
#           children: [
#             {
#               name: "FailedState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],
#               isEntity: true,
#             },
#             {
#               name: "DegradedState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],
#               isEntity: true,
#             },
#           ],

#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Process",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[10],
#       children: [
#         {
#           name: "DesirableProcess",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[10],


#         },
#         {
#           name: "UndesirableProcess",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[10],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Activity",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[0],
#       children: [
#         {
#           name: "MaintenanceActivity",

#           children: [
#             {
#               name: "Adjust",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],
#               isEntity: true,
#             },
#             {
#               name: "Calibrate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],
#               isEntity: true,
#             },
#             {
#               name: "Diagnose",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],
#               isEntity: true,
#             },
#             {
#               name: "Inspect",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Replace",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Repair",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Service",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "SupportingActivity",

#           children: [
#             {
#               name: "Admin",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Assemble",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Isolate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Measure",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Modify",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Move",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Operate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Perform",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Teamwork",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "Property",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[9],
#       children: [
#         {
#           name: "DesirableProperty",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#         {
#           name: "UndesirableProperty",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "PhysicalObject",
#       description: "Child of /Object",
#       color: MUI_COLOR_PALETTEE_500[7],

#       isEntity: true,
#       children: [
#         {
#           name: "Substance",


#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "Organism",

#           color: MUI_COLOR_PALETTEE_500[7],


#           children: [
#             {
#               name: "Person",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#         },
#         {
#           name: "SensingObject",

#           children: [
#             {
#               name: "ElectricPotentialSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ResistivitySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricCurrentSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "DensitySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FieldSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FlowSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PhysicalDimensionSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnergySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PowerSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TimeSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LevelSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HumiditySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PressureSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ConcentrationSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "RadiationSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TimeRatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TemperatureSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultiQuantitySensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ForceSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AudioVisualSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "InformationSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "IncidentSensingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "StoringObject",

#           children: [
#             {
#               name: "CapacitiveStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "InductiveStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },

#             {
#               name: "ElectrochemicalStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "InformationStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpenStationaryStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnclosedStationaryStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MoveableStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalEnergyStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyStoringObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "EmittingObject",

#           children: [
#             {
#               name: "LightObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricCoolingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "WirelessPowerObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalEnergyTransferObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CombustionHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalCoolingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "NuclearPoweredHeatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ParticleEmittingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AcousticWaveEmittingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "ProtectingObject",

#           children: [
#             {
#               name: "OvervoltageProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EarthFaultCurrentProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OvercurrentProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FieldProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PressureProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FireProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalForceProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PreventiveProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "WearProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnvironmentProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TemperatureProtectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "GeneratingObject",

#           children: [
#             {
#               name: "MechanicalToElectricalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ChemicalToElectricalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolarToElectricalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SignalGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ContinuousTransferObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "DiscontinuousTransferObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LiquidFlowGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "GaseousFlowGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolarToThermalEnergyGeneratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "MatterProcessingObject",

#           children: [
#             {
#               name: "PrimaryFormingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SurfaceTreatmentObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AssemblingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ForceSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricOrMagneticSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ChemicalSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "GrindingAndCrushingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AgglomeratingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MixingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReactingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "InformationProcessingObject",

#           children: [
#             {
#               name: "ElectricSignalProcessingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSignalRelayingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpticalSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FluidSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleKindSignallingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "DrivingObject",

#           children: [
#             {
#               name: "ElectromagneticRotationalDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectromagneticLinearDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MagneticForceDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PiezoelectricDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FluidPoweredDrivingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CombustionEngine",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HeatEngine",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "CoveringObject",

#           children: [
#             {
#               name: "InfillingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ClosureObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FinishingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TerminatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "PresentingObject",

#           children: [
#             {
#               name: "VisibleStateIndicator",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ScalarDisplay",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "GraphicalDisplay",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AcousticDevice",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "TactileDevice",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OrnamentalObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleFormPresentingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "ControllingObject",

#           children: [
#             {
#               name: "ElectricControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSeparatingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricEarthingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SealedFluidSwitchingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SealedFluidVaryingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpenFlowControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SpaceAccessObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolidSubstanceFlowVaryingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalMovementControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleMeasureControllingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "RestrictingObject",

#           children: [
#             {
#               name: "ElectricityRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricityStabilisingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SignalStabilisingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MovementRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReturnFlowRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FlowRestrictor",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LocalClimateStabilisingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "AccessRestrictingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "HumanInteractionObject",

#           children: [
#             {
#               name: "FaceInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "HandInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FootInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FingerInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MovementInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultiInteractionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "TransformingObject",

#           children: [
#             {
#               name: "ElectricEnergyTransformingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricEnergyConvertingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "UniversalPowerSupply",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SignalConvertingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyTransformingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MassReductionObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MatterReshapingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OrganicPlant",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "HoldingObject",

#           children: [
#             {
#               name: "PositioningObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CarryingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "EnclosingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "StructuralSupportingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ReinforcingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FramingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "JointingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "FasteningObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LevellingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ExistingGround",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "GuidingObject",

#           children: [
#             {
#               name: "ElectricEnergyGuidingObject",
#               description: "Merged High Voltage and Low Voltage",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],
#               isEntity: true,
#             },
#             {
#               name: "ReferencePotentialGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],
#               isEntity: true,
#             },
#             {
#               name: "ElectricSignalGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LightGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SoundGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SolidMatterGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "OpenEnclosureGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ClosedEnclosureGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MechanicalEnergyGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "RailObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ThermalEnergyGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleFlowGuidingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "InterfacingObject",

#           children: [
#             {
#               name: "HighVoltageConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LowVoltageConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "PotentialConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "ElectricSignalConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LightCollectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "CollectingInterfacingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SealedFlowConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "NonDetachableCoupling",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "DetachableCoupling",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "LevelConnectingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "SpaceLinkingObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#             {
#               name: "MultipleFlowConnectorObject",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#       ],
#     },
#   ],
#   MESSALite: [
#     {
#       name: "State",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[8],
#       children: [
#         {
#           name: "DesirableState",

#           color: MUI_COLOR_PALETTEE_500[8],
#           children: [
#             {
#               name: "NormalState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],
#               isEntity: true,
#             },
#           ],

#         },
#         {
#           name: "UndesirableState",

#           color: MUI_COLOR_PALETTEE_500[8],
#           children: [
#             {
#               name: "FailedState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],
#               isEntity: true,
#             },
#             {
#               name: "DegradedState",
#               description: "",
#               color: MUI_COLOR_PALETTEE_500[8],
#               children: [],
#               isEntity: true,
#             },
#           ],

#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Process",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[10],
#       children: [
#         {
#           name: "DesirableProcess",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[10],


#         },
#         {
#           name: "UndesirableProcess",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[10],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Activity",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[0],
#       children: [
#         {
#           name: "MaintenanceActivity",

#           children: [
#             {
#               name: "Adjust",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],
#               isEntity: true,
#             },
#             {
#               name: "Calibrate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],
#               isEntity: true,
#             },
#             {
#               name: "Diagnose",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],
#               isEntity: true,
#             },
#             {
#               name: "Inspect",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Replace",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Repair",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Service",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "SupportingActivity",

#           children: [
#             {
#               name: "Admin",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Assemble",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Isolate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Measure",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Modify",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Move",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Operate",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Perform",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#             {
#               name: "Teamwork",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[0],

#               isEntity: true,
#             },
#           ],
#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Property",
#       description: "",
#       expanded: true,
#       color: MUI_COLOR_PALETTEE_500[9],
#       children: [
#         {
#           name: "DesirableProperty",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#         {
#           name: "UndesirableProperty",

#           expanded: true,
#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "PhysicalObject",
#       description: "Child of /Object",
#       color: MUI_COLOR_PALETTEE_500[7],
#       isEntity: true,
#       children: [
#         {
#           name: "Substance",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "Organism",

#           color: MUI_COLOR_PALETTEE_500[7],

#           children: [
#             {
#               name: "Person",
#               description: "",
#               children: [],
#               color: MUI_COLOR_PALETTEE_500[7],
#               isEntity: true,
#             },
#           ],
#         },
#         {
#           name: "SensingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "StoringObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "EmittingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "ProtectingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "GeneratingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "MatterProcessingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "InformationProcessingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "DrivingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "CoveringObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "PresentingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "ControllingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "RestrictingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "HumanInteractionObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "TransformingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "HoldingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "GuidingObject",


#           color: MUI_COLOR_PALETTEE_500[7],

#         },
#         {
#           name: "InterfacingObject",


#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#       ],
#     },
#   ],
#   GeoDoc: [
#     {
#       name: "general",
#       description: "",
#       children: [
#         {
#           name: "academic discipline",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "element symbol",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "chemical element",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "organisation",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "profession",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "technique",


#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[0],

#       isEntity: true,
#     },
#     {
#       name: "geological",
#       description: "",
#       children: [
#         {
#           name: "commodity",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "mineral group",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "mineral",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "timescale",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "project",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "deposit",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "model",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "map",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "scale",


#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[1],

#       isEntity: true,
#     },
#     {
#       name: "location",
#       description: "",
#       children: [
#         {
#           name: "country",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "state",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "city",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "locality",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "province",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#         {
#           name: "stratigraphy",


#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#       ],
#       color: MUI_COLOR_PALETTEE_500[2],

#       isEntity: true,
#     },
#   ],
#   CORE: [
#     {
#       name: "PhysicalObject",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[0],
#       children: [
#         {
#           name: "ProtectingObject",

#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#         {
#           name: "Substance",

#           color: MUI_COLOR_PALETTEE_500[0],


#         },
#       ],

#       isEntity: true,
#     },
#     {
#       name: "Activity",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[1],
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "State",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[2],
#       children: [],
#       isEntity: true,
#     },
#   ],
#   RedCoat: [
#     {
#       name: "Item",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[0],
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Consumable_or_commodity",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[1],
#       children: [
#         {
#           name: "Consumable",

#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "Commodity",

#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#         {
#           name: "Waste_biproduct",

#           color: MUI_COLOR_PALETTEE_500[1],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Activity",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[2],
#       children: [
#         {
#           name: "Lubrication",

#           color: MUI_COLOR_PALETTEE_500[2],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Observed_state",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[3],
#       children: [
#         {
#           name: "Desirable",

#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#         {
#           name: "Undesirable",

#           color: MUI_COLOR_PALETTEE_500[3],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Negation",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[4],
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Location",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[5],
#       children: [
#         {
#           name: "Absolute_loc",

#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#         {
#           name: "Relative_loc",

#           color: MUI_COLOR_PALETTEE_500[5],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Action",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[6],
#       children: [
#         {
#           name: "Function",

#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#         {
#           name: "Malfunction",

#           color: MUI_COLOR_PALETTEE_500[6],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Attribute",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[7],
#       children: [
#         {
#           name: "Attribute_desc",

#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#         {
#           name: "Attribute_value",

#           color: MUI_COLOR_PALETTEE_500[7],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Cardinality",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[8],
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Time",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[9],
#       children: [
#         {
#           name: "Absolute_time",

#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#         {
#           name: "Relative_time",

#           color: MUI_COLOR_PALETTEE_500[9],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Identifier",
#       description: "",
#       color: MUI_COLOR_PALETTEE_500[10],
#       children: [
#         {
#           name: "Item_ID",

#           color: MUI_COLOR_PALETTEE_500[10],


#         },
#         {
#           name: "Make",

#           color: MUI_COLOR_PALETTEE_500[10],


#         },
#       ],
#       isEntity: true,
#     },
#     {
#       name: "Agent",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Specifier",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Cause",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Document",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Unsure",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Abbreviation",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Code",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Typo",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Suggest_tag",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#     {
#       name: "Unsure",
#       description: "",
#       color: getRandomColor(),
#       children: [],
#       isEntity: true,
#     },
#   ],
# };

# RelationOntologyPresets = {
#   custom: [
#     {
#       name: "",
#       placeholder: "Enter relation name",
#       description: "",
#       domain: [],
#       range: [],
#       children: [],
#       isEntity: false,
#     },
#   ],

#   MIE: [
#     {
#       name: "connectedTo",
#       description: "",

#       isEntity: false,
#       children: [
#         {
#           name: "directlyConnectedTo",


#           isEntity: false,

#         },
#       ],
#     },
#     {
#       name: "hasPart",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [
#         {
#           name: "hasActivityPart",

#           domain: ["Activity"],
#           range: ["Activity"],

#           isEntity: false,
#           children: [
#             {
#               name: "hasActivityBound",
#               description: "",
#               domain: ["Activity"],
#               range: ["Activity"],

#               isEntity: false,
#               children: [],
#             },
#           ],
#         },
#         {
#           name: "hasArrangedPart",


#           isEntity: false,
#           children: [
#             {
#               name: "hasAssembledPart",
#               description: "",

#               isEntity: false,
#               children: [],
#             },
#             {
#               name: "hasFeature",
#               description: "",

#               isEntity: false,
#               children: [],
#             },
#           ],
#         },
#         {
#           name: "hasFunctionalPart",


#           isEntity: false,

#         },
#         {
#           name: "hasSubLocation",

#           range: ["Location"],

#           isEntity: false,

#         },
#       ],
#     },
#     {
#       name: "hasParticipant",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [
#         {
#           name: "hasAgent",

#           domain: ["all"],
#           range: ["all"],

#           isEntity: false,

#         },
#         {
#           name: "hasPatient",

#           domain: ["all"],
#           range: ["all"],

#           isEntity: false,

#         },
#         {
#           name: "hasInstrumentOrAttribute",

#           domain: ["all"],
#           range: ["all"],

#           isEntity: false,

#         },
#       ],
#     },
#     {
#       name: "hasQuality",
#       description: "",
#       domain: ["all"],
#       range: ["Quality"],

#       isEntity: false,
#       children: [
#         {
#           name: "hasPhysicalQuantity",

#           range: ["Quality/PhysicalQuantity"],

#           isEntity: false,

#         },
#       ],
#     },
#     {
#       name: "hasRole",
#       description: "",
#       domain: ["all"],
#       range: ["RealizableEntity/Role"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "locatedRelativeTo",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [
#         {
#           name: "contains",


#           isEntity: false,

#         },
#         {
#           name: "residesIn",

#           range: ["Location"],

#           isEntity: false,

#         },
#       ],
#     },
#     {
#       name: "hasTrajector",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasLandmark",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasPath",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasOrientation",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "occursRelativeTo",
#       description: "",
#       domain: ["Activity"],
#       range: ["Activity"],

#       isEntity: false,
#       children: [
#         {
#           name: "after",

#           domain: ["Activity"],
#           range: ["Activity"],

#           isEntity: false,

#         },
#         {
#           name: "before",

#           domain: ["Activity"],
#           range: ["Activity"],

#           isEntity: false,
#           children: [
#             {
#               name: "causes",
#               description: "",
#               domain: ["Activity"],
#               range: ["Activity"],

#               isEntity: false,
#               children: [],
#             },
#           ],
#         },
#       ],
#     },
#     {
#       name: "hasAttribute",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasProduct",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#   ],
#   FMEA: [
#     {
#       name: "hasMode",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "causedBy",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "effects",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasMechanism",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "occursRelativeTo",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasComponent",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasPart",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "identifiedBy",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "detectedBy",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "locatedRelativeTo",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "atLocation",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#   ],
#   MESSA: [
#     {
#       name: "hasPart",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "contains",
#       description: "",

#       isEntity: false,
#       children: [],
#     },
#     {
#       name: "hasParticipant",
#       description: "",
#       domain: ["all"],
#       range: ["all"],

#       isEntity: false,
#       children: [
#         {
#           name: "hasAgent",
#           description: "PropBank argument 0",
#           domain: ["all"],
#           range: ["all"],

#           isEntity: false,

#         },
#         {
#           name: "hasPatient",
#           description: "PropBank argument 1",
#           domain: ["all"],
#           range: ["all"],

#           isEntity: false,

#         },
#         {
#           name: "hasInstrumentOrAttribute",
#           description: "PropBank argument 2",
#           domain: ["all"],
#           range: ["all"],

#           isEntity: false,

#         },
#       ],
#     },
#     {
#       name: "hasProperty",
#       description: "",
#       domain: ["all"],
#       range: ["Property"],

#       isEntity: false,
#       children: [],
#     },
#   ],
#   CORE: [
#     {
#       name: "hasPart",
#       placeholder: "",
#       description: "",
#       children: [],

#       isEntity: false,
#     },
#     {
#       name: "hasParticipant",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],

#       isEntity: false,
#     },
#     {
#       name: "contains",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],

#       isEntity: false,
#     },
#   ],
#   RedCoat: [
#     {
#       name: "hasCause",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],
#       isEntity: false,
#     },
#     {
#       name: "hasState",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],
#       isEntity: false,
#     },
#     {
#       name: "hasAttribute",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],
#       isEntity: false,
#     },
#     {
#       name: "hasComponent",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],
#       isEntity: false,
#     },
#     {
#       name: "hasFunction",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],
#       isEntity: false,
#     },
#     {
#       name: "coreference",
#       placeholder: "",
#       description: "",
#       domain: ["all"],
#       range: ["all"],
#       children: [],
#       isEntity: false,
#     },
#   ],
# };

# MiscBaseOntologyItems = {
#   Unsure: {
#     name: "Unsure",
#     fullName: "Unsure",
#     description: "Class for marking when an entity mention is ambiguous",
#     children: [],
#     color: orange[500],
#     _id: uuidv4(),
#     isEntity: true,
#   },
#   Identifier: {
#     name: "Identifier",
#     fullName: "Identifier",
#     description:
#       "Class for marking when an entity mention represents an identifier (typically alphanumerical)",
#     children: [],
#     color: blue[500],
#     _id: uuidv4(),
#     isEntity: true,
#   },
#   Sensitive: {
#     name: "Sensitive",
#     fullName: "Sensitive",
#     description: "Class for marking when an entity mention is sensitive",
#     children: [],
#     color: red[500],
#     _id: uuidv4(),
#     isEntity: true,
#   },
#   Noise: {
#     name: "Noise",
#     fullName: "Noise",
#     description:
#       "Class for marking when an entity mention contains lexical noise",
#     children: [],
#     color: orange[500],
#     _id: uuidv4(),
#     isEntity: true,
#   },
#   TranslationError: {
#     name: "TranslationError",
#     fullName: "TranslationError",
#     description:
#       "Class for marking when an entity mention is a translation error",
#     children: [],
#     color: orange[500],
#     _id: uuidv4(),
#     isEntity: true,
#   },
# };
