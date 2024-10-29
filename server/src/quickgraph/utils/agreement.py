import itertools
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple


class AgreementCalculator:
    """
    A class to calculate inter-annotator agreement between each pair of users and overall
    using Jaccard similarity.

    Attributes:
        entity_data (List[Dict[str, str]]): A list of entities. Each entity is a dictionary containing 'start', 'end',
            'label', 'username' and 'doc_id' keys.
        relation_data (Optional[List[Dict[str, str]]]): A list of relations. Each relation is a dictionary containing
            'username', 'source', 'target', 'label', and 'doc_id' keys. 'source' and 'target' are dictionaries
            containing 'start', 'end', and 'label' keys.

    Methods:
        jaccard_similarity(data_set1: List[Tuple[int, int, str]],
            data_set2: List[Tuple[int, int, str]]) -> float:
            Calculate Jaccard similarity between two sets of data.
        calculate_agreements(data_type: str = 'entity') -> Dict[str, Dict[str, float]]:
            Calculate inter-annotator agreement between each pair of users for entities or relations.
        overall_agreement(data_type: str = 'entity') -> float:
            Calculate overall agreement by averaging the pairwise similarities for entities or relations.
        overall_average_agreement() -> float:
            Calculate the overall average agreement for both entities and relations.

    Example:
        agreement_calculator = AgreementCalculator(entity_data, relation_data)
        entity_agreement = agreement_calculator.overall_agreement('entity')
        relation_agreement = agreement_calculator.overall_agreement('relation')
        overall_average_agreement = agreement_calculator.overall_average_agreement()
    """

    def __init__(
        self,
        entity_data: List[Dict[str, str]],
        relation_data: Optional[List[Dict[str, str]]] = None,
    ) -> None:
        """
        Initialize AgreementCalculator with a list of entities and relations.

        Args:
            entity_data: A list of entities. Each entity is a dictionary containing 'start', 'end',
                  'label', 'username' and 'doc_id' keys.
            relation_data: A list of relations. Each relation is a dictionary containing 'username',
                  'source', 'target', 'label', and 'doc_id' keys. 'source' and 'target' are dictionaries containing
                  'start', 'end', and 'label' keys.
        """
        self.entity_data = entity_data
        self.relation_data = relation_data if relation_data else []

    def jaccard_similarity(
        self,
        data_set1: List[Tuple[int, int, str]],
        data_set2: List[Tuple[int, int, str]],
    ) -> float:
        """
        Calculate Jaccard similarity between two sets of data.

        Args:
            data_set1: The first set of data. Each data point is represented as a tuple.
            data_set2: The second set of data. Each data point is represented as a tuple.

        Returns:
            Jaccard similarity as a float.
        """
        if len(data_set1) == 0 and len(data_set2) == 0:
            return 1.0
        elif len(data_set1) == 0 or len(data_set2) == 0:
            return 0.0
        else:
            intersection = len(set(data_set1) & set(data_set2))
            union = len(set(data_set1) | set(data_set2))
            return intersection / union

    def calculate_agreements(
        self, data_type: str = "entity"
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate inter-annotator agreement between each pair of users for entities or relations.

        Args:
            data_type: The type of data for which to calculate agreements. Either 'entity' or 'relation'.

        Returns:
            A dictionary containing agreement scores between each pair of users.
        """
        if data_type == "entity":
            data = self.entity_data
        elif data_type == "relation":
            data = self.relation_data
        else:
            raise ValueError(
                f"Invalid data_type: {data_type}. Expected 'entity' or 'relation'."
            )

        user_data = defaultdict(list)
        users = set()
        for item in data:
            users.add(item["username"])

            if "source" in item and "target" in item:
                user_data[item["username"]].append(
                    (
                        item["source"]["start"],
                        item["source"]["end"],
                        item["source"]["label"],
                        item["target"]["start"],
                        item["target"]["end"],
                        item["target"]["label"],
                        item["label"],
                        item["doc_id"],
                    )
                )
            elif "start" in item and "end" in item and "label" in item:
                user_data[item["username"]].append(
                    (
                        item["start"],
                        item["end"],
                        item["label"],
                        item["doc_id"],
                    )
                )

        agreements = defaultdict(dict)
        for user1, user2 in itertools.combinations(users, 2):
            # print(data_type, len(user_data[user1]), len(user_data[user2]))
            similarity = self.jaccard_similarity(user_data[user1], user_data[user2])
            agreements[user1][user2] = similarity
            agreements[user2][user1] = similarity

        return agreements

    def overall_agreement(self, data_type: str = "entity") -> float:
        """
        Calculate overall agreement by averaging the pairwise similarities for entities or relations.

        Args:
            data_type: The type of data for which to calculate overall agreement. Either 'entity' or 'relation'.

        Returns:
            Overall agreement as a float.
        """
        agreements = self.calculate_agreements(data_type)
        total_similarity = 0
        count = 0
        for user1 in agreements:
            for user2 in agreements[user1]:
                total_similarity += agreements[user1][user2]
                count += 1
        return total_similarity / count if count > 0 else 0

    def overall_average_agreement(self) -> float:
        """
        Calculate the weighted average agreement between entities and relations.

        Returns:
            The overall weighted average agreement as a float. The score is normalized based on the total number of
            entities and relations annotated by all users. If there are no entities or relations, the method returns 0.
        """

        entity_agreement = self.overall_agreement("entity")
        relation_agreement = self.overall_agreement("relation")

        num_entities = len(self.entity_data)
        num_relations = len(self.relation_data)

        total_items = num_entities + num_relations

        if total_items == 0:
            return 0

        weighted_agreement = (
            (entity_agreement * num_entities) + (relation_agreement * num_relations)
        ) / total_items

        return weighted_agreement

    def count_majority_agreements(self, data_type: str = "entity"):
        """Counts the instances that have majority agreement."""

        if data_type == "entity":
            data = self.entity_data
        elif data_type == "relation":
            data = self.relation_data
        else:
            raise ValueError(
                f"Invalid data_type: {data_type}. Expected 'entity' or 'relation'."
            )

        _data = []
        users_per_doc = defaultdict(set)
        for item in data:
            users_per_doc[item["doc_id"]].add(item["username"])
            if "source" in item and "target" in item:
                _data.append(
                    (
                        item["source"]["start"],
                        item["source"]["end"],
                        item["source"]["label"],
                        item["target"]["start"],
                        item["target"]["end"],
                        item["target"]["label"],
                        item["label"],
                        item["doc_id"],
                    )
                )
            elif "start" in item and "end" in item and "label" in item:
                _data.append(
                    (item["start"], item["end"], item["label"], item["doc_id"])
                )

        # Get the counts of saved annotators on the documents
        users_per_doc = {doc_id: len(users) for doc_id, users in users_per_doc.items()}

        # Count frequencies
        counter = Counter(_data)

        majority_count = sum(
            1
            for item, count in counter.items()
            if count / users_per_doc[item[-1]] > 0.5
        )

        return majority_count
