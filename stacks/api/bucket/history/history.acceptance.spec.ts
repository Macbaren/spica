import {INestApplication} from "@nestjs/common";
import {Request, CoreTestingModule} from "@spica-server/core/testing";
import {TestingModule, Test} from "@nestjs/testing";
import {PassportTestingModule} from "@spica-server/passport/testing";
import {DatabaseTestingModule, DatabaseService, ObjectId} from "@spica-server/database/testing";
import {HistoryModule} from "./history.module";
import {ChangeKind, diff} from "./differ";
import {HistoryService} from "./history.service";

describe("History Acceptance", () => {
  let app: INestApplication;
  let req: Request;
  let module: TestingModule;

  const bucketId = new ObjectId();
  const documentId = new ObjectId();
  const anotherDocumentId = new ObjectId();

  const firstHistoryId = new ObjectId(
    Math.floor(new Date(2018, 5, 10).getTime() / 1000).toString(16) + "0000000000000000"
  );
  const secondHistoryId = new ObjectId(
    Math.floor(new Date(2018, 5, 11).getTime() / 1000).toString(16) + "0000000000000000"
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        CoreTestingModule,
        PassportTestingModule.initialize(),
        DatabaseTestingModule.replicaSet(),
        HistoryModule
      ]
    }).compile();
    app = module.createNestApplication();
    req = module.get(Request);
    await app.listen(req.socket);

    //add bucket
    await app
      .get(DatabaseService)
      .collection("buckets")
      .insertOne({
        _id: bucketId,
        title: "New Bucket",
        description: "Describe your new bucket",
        icon: "view_stream",
        primary: "title",
        readOnly: false,
        properties: {
          title: {
            type: "string",
            title: "title",
            description: "Title of the row",
            options: {position: "left", visible: true}
          },
          description: {
            type: "string",
            title: "description",
            description: "Description of the row",
            options: {position: "right"}
          }
        }
      });
    //add documents
    await app
      .get(DatabaseService)
      .collection(`bucket_${bucketId}`)
      .insertMany([
        {_id: documentId, title: "current title", description: "current description"},
        {
          _id: anotherDocumentId,
          title: "another document title",
          description: "another document description"
        }
      ]);
    //add histories
    await app.get(HistoryService).insertOne({
      bucket_id: bucketId,
      document_id: documentId,
      title: "first history",
      changes: diff(
        {title: "current title", description: "current description"},
        {title: "updated title", description: "updated description"}
      )
    });
    await app.get(HistoryService).insertOne({
      bucket_id: bucketId,
      document_id: documentId,
      title: "second history",
      changes: diff(
        {title: "updated title", description: "updated description"},
        {title: "last updated title", description: "last updated description"}
      )
    });
  }, 100000);

  afterAll(async () => {
    await app
      .get(DatabaseService)
      .collection("buckets")
      .deleteOne({_id: bucketId});
    await app
      .get(DatabaseService)
      .collection(`bucket_${bucketId}`)
      .deleteMany({});
    await app
      .get(DatabaseService)
      .collection("history")
      .deleteMany({});

    await app.close();
  });

  it("should get all histories of spesific bucket document", async () => {
    const response = await req.get(`/bucket/${bucketId}/history/${documentId}`, {});
    expect([response.statusCode, response.statusText]).toEqual([200, "OK"]);

    const histories = response.body;
    expect(histories).toEqual([
      {_id: secondHistoryId.toHexString(), date: new Date(2018, 5, 11).toISOString(), changes: 2},
      {_id: firstHistoryId.toHexString(), date: new Date(2018, 5, 10).toISOString(), changes: 2}
    ]);
  });

  xit("should get spesific document", async () => {
    const second = await app
      .get(HistoryService)
      .collection.find({})
      .toArray()[1]._id;

    const response = await req.get(`/bucket/${bucketId}/history/${documentId}/${second}`, {});

    expect(response.body).toEqual({} as any);
  });
});
