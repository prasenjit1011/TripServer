## -: Readme :-
## Important Command List

node --env-file=.env app.js


 let merchantData = {
                ...req.body,
                // image: img_loc,
                addedBy: new mongoose.Types.ObjectId(req.user._id),
                type: "admin",
                designation: "marchentAdminstrative",
                passwordCrypto: encryptedMsg,
                password: passwordHash.generate(req.body.password),
                token: createToken(req.body),
                createdOn: new Date(),
              };

              const admin = new Merchant(merchantData);
              const company=new companyModel(merchantData)
              return admin.save().then((data) => {
                const name = data.firstName;
                // console.log("name",data.firstName);

                if (data) {
                  sendPasswordMail(name, req.body.email, data._id);
                  res.status(ResponseCode.errorCode.success).json({
                    status: true,
                    message: "Merchant created successfully",
                  });
                } else {
                  res.status(ResponseCode.errorCode.requiredError).json({
                    status: false,
                    message: "Merchant register failed",
                  });
                }
              });
              kono collection create korar samay duto table er data aksathe akta api te kora jay