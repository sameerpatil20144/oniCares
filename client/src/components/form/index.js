

<Container maxWidth="sm">
    <Typography component="div" className="login-wrap">
        <Card className="login-card">   
            <CardContent>
                <Typography align="center" variant="h6" component="h2">
                    Login
                </Typography>

                <ValidatorForm
                    ref="form"
                    onSubmit={this.handleSubmit}
                    onError={errors => console.log(errors)}
                >
                    <FormControl fullWidth>
                        <TextValidator
                            label="Email"
                            onChange={this.handleChange}
                            name="email"
                            value={this.state.email}
                            validators={['required', 'isEmail']}
                            errorMessages={['this field is required', 'email is not valid']}
                        />
                    </FormControl>
                    <FormControl fullWidth>
                        <TextValidator
                            label="Password"
                            onChange={this.handleChange}
                            type="password"
                            name="password"
                            value={this.state.password}
                            validators={['required']}
                            errorMessages={['this field is required']}
                        />
                    </FormControl>
                    <Button type="submit" fullWidth variant="contained" size="medium" color="primary" className="login-btn">Login</Button>
                </ValidatorForm>
            </CardContent>
        </Card>
    </Typography>
</Container>