from bson import ObjectId


class PyObjectId(ObjectId):
    # https://www.mongodb.com/developer/languages/python/python-quickstart-fastapi/#prerequisites
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")
