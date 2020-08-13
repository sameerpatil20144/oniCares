import React from 'react';
import { Table } from 'react-bootstrap'

const CommonTable = ({ thead, children, className }) => {


    const Header = ({ thead }) => {
        return (
            <thead>
                <tr>
                    {
                        thead.map((v, k) => {
                            return (
                                <th key={k}>{v}</th>
                            )
                        })
                    }
                </tr>
            </thead>
        )


    }

    return (

        <div className="table-border">
            <Table responsive className={className}>
                {thead &&
                    <Header thead={thead} />
                }
                <tbody>
                    {children}
                </tbody>
            </Table>
        </div>
    )
}

export default CommonTable